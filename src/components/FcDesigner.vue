<template>
    <a-config-provider :theme="{token: {fontSize: 14,fontSizeSM: 12}}">
        <a-layout class="_fc-designer" :style="height ? `height:${dragHeight};flex:initial;` : ''" ref="designer"
                  @dragenter="handleDragenter" @dragleave="handleDragleave" @drop="handleDrop">
            <a-layout-content>
                <a-layout style="height: 100%;" :key="locale && locale.name">
                    <a-layout-sider class="_fc-l-menu" width="40px">
                        <a-tooltip
                            :title="t('designer.comList')"
                            placement="right"
                        >
                            <div class="_fc-l-menu-item" :class="{active: activeModule === 'base'}"
                                 @click="activeModule = 'base'">
                                <i class="fc-icon icon-menu"></i>
                            </div>
                        </a-tooltip>
                        <a-tooltip
                            v-if="getConfig('showLanguage', true)"
                            :title="t('language.name')"
                            placement="right"
                        >
                            <div class="_fc-l-menu-item" :class="{active: activeModule === 'language'}"
                                 @click="activeModule = 'language'">
                                <i class="fc-icon icon-language"></i>
                            </div>
                        </a-tooltip>
                        <a-tooltip
                            v-if="getConfig('showJsonPreview', true)"
                            title="JSON"
                            placement="right"
                        >
                            <div class="_fc-l-menu-item" :class="{active: activeModule === 'json'}"
                                 @click="activeModule = 'json'">
                                <i class="fc-icon icon-script"></i>
                            </div>
                        </a-tooltip>
                    </a-layout-sider>
                    <a-layout-sider class="_fc-l" :width="activeModule === 'language' ? '450px' : '266px'">
                        <LanguageConfig v-if="activeModule === 'language'"></LanguageConfig>
                        <JsonPreview v-if="activeModule === 'json'"></JsonPreview>
                        <a-layout v-if="activeModule === 'base'">
<!--                          左侧TAB功能：组件、字段、大纲-->
                            <a-layout-header style="height:40px;" class="_fc-l-tabs">
                                <div class="_fc-l-tab" :class="{active: activeMenuTab==='menu'}"
                                     @click="activeMenuTab='menu'"> {{ t('menu.component') }}
                                </div>
                              <div class="_fc-l-tab" :class="{active: activeMenuTab==='field'}"
                                   @click="activeMenuTab='field'"> {{ t('menu.field') }}
                              </div>
                                <div class="_fc-l-tab" :class="{active: activeMenuTab==='tree'}"
                                     @click="activeMenuTab='tree'"> {{ t('menu.tree') }}
                                </div>
                            </a-layout-header>
<!--                          组件内容-->
                            <a-layout-content v-show="activeMenuTab === 'menu'">
                                <template v-for="(item, index) in menuList" :key="index">
                                    <div class="_fc-l-group"
                                         v-if="hiddenMenu.indexOf(item.name) === -1">
                                        <h4 class="_fc-l-title" @click="item.hidden = !item.hidden">
                                            {{ t('menu.' + item.name) || item.title }}
                                            <i class="fc-icon icon-arrow" :class="{down: !item.hidden}"/>
                                        </h4>
                                        <fcDraggable :group="{name:'default', pull:'clone', put:false}" :sort="false"
                                                     itemKey="name"
                                                     class="_fc-l-list"
                                                     :list="item.list" v-show="!item.hidden">
                                            <template #item="{element}">
                                                <div class="_fc-l-item" v-if="hiddenItem.indexOf(element.name) === -1"
                                                     @click="clickMenu(element)">
                                                        <div class="_fc-l-icon">
                                                            <i class="fc-icon" :class="element.icon || 'icon-input'"></i>
                                                        </div>
                                                        <span class="_fc-l-name">{{
                                                                t('com.' + element.name + '.name') || element.label
                                                            }}</span>
                                                </div>
                                            </template>
                                        </fcDraggable>
                                    </div>
                                </template>
                            </a-layout-content>

<!--                          字段内容-->
                            <a-layout-content v-show="activeMenuTab === 'field'">
                              <a-input-search v-model:value="searchValue" style="margin:10px auto 10px 5px;width: 95%" allow-clear placeholder="请输入关键词" />

                              <a-directory-tree
                                  v-model:expandedKeys="expandedKeys"
                                  :selectable="false"
                                  :tree-data="fieldTreeData"
                                  @click="onFieldTreeSelect"
                              >
                                <template #icon="{ key, children,selected }">
                                  <i class="fc-icon icon-folder" style="color: #2E73FF" v-if="children"></i>
                                  <i class="fc-icon icon-input" style="color: #2E73FF" v-else></i>
                                </template>
                              </a-directory-tree>

                            </a-layout-content>

<!--                          大纲内容-->
                            <a-layout-content v-if="activeMenuTab === 'tree'">
                                <a-directory-tree
                                    ref="treeRef"
                                    class="_fc-struct-tree"
                                    :tree-data="treeInfo"
                                    :selectable="false"
                                    :showIcon="false"
                                    defaultExpandAll
                                >
                                    <template #title="{data}">
                                        <div class="_fc-tree-node" @click.stop="(e) => treeChange(e, data)"
                                             :class="{active: activeRule === data.rule}">
                                            <div class="_fc-tree-label">
                                                <i class="fc-icon"
                                                   :class="(data.rule._menu && data.rule._menu.icon) || 'icon-cell'"></i>
                                                <span>{{
                                                        (data.rule?.__fc__?.refRule?.__$title?.value || data.rule.title || '').trim() || (data.rule.props && data.rule.props.label) || t('com.' + (data.rule._menu && data.rule._menu.name) + '.name') || (data.rule._menu && data.rule._menu.label) || data.rule.type
                                                    }}</span>
                                            </div>
                                            <div class="_fc-tree-more" @click.stop
                                                 v-if="!data.slot">
                                                <a-dropdown size="default" trigger="click">
                                                    <i class="fc-icon icon-more"></i>
                                                    <template #overlay>
                                                        <a-menu>
                                                            <a-menu-item v-if="data.rule._fc_drag_tag !== '_'" key="1"
                                                                         @click="toolHandle(data.rule ,'copy')">
                                                                {{ t('props.copy') }}
                                                            </a-menu-item>
                                                            <a-menu-item
                                                                v-if="data.rule._menu && data.rule._menu.children && data.rule._fc_drag_tag !== '_'"
                                                                key="2"
                                                                @click="toolHandle(data.rule, 'addChild')">
                                                                {{ t('form.appendChild') }}
                                                            </a-menu-item>
                                                            <a-menu-item key="3"
                                                                         @click="toolHandle(data.rule, 'delete')">
                                                                {{ t('props.delete') }}
                                                            </a-menu-item>
                                                        </a-menu>
                                                    </template>
                                                </a-dropdown>
                                            </div>
                                        </div>
                                    </template>
                                </a-directory-tree>
                            </a-layout-content>
                        </a-layout>
                    </a-layout-sider>
<!--                  内容拖拽区-->
                    <a-layout class="_fc-m">
                        <a-layout-header class="_fc-m-tools" style="height:40px;">
                            <div class="_fc-m-tools-l">
                                <template v-if="!inputForm.state">
                                    <template v-if="getConfig('showDevice') !== false">
                                        <div class="devices">
                                            <i class="fc-icon icon-pc" :class="{active: device === 'pc'}"
                                               @click="setDevice('pc')"></i>
                                            <i class="fc-icon icon-pad" :class="{active: device === 'pad'}"
                                               @click="setDevice('pad')"></i>
                                            <i class="fc-icon icon-mobile" :class="{active: device === 'mobile'}"
                                               @click="setDevice('mobile')"></i>
                                        </div>
                                        <div class="line"></div>
                                    </template>
                                    <div>
                                        <i class="fc-icon icon-pre-step"
                                           :class="{disabled: !operation.list[operation.idx - 1]}"
                                           @click="prevOperationRecord"></i>
                                        <i class="fc-icon icon-next-step"
                                           :class="{disabled: !operation.list[operation.idx + 1]}"
                                           @click="nextOperationRecord"></i>
                                    </div>
                                </template>
                            </div>
                            <div class="_fc-m-tools-r">
                                <template v-if="!inputForm.state">
                                    <slot name="handle"></slot>
                                    <a-button class="_fd-btn-success" v-if="getConfig('showSaveBtn', false)"
                                              size="small" @click="handleSave">
                                        <i class="fc-icon icon-save"></i> {{
                                            t('props.save')
                                        }}
                                    </a-button>
                                    <a-button class="_fd-btn-primary" size="small" @click="openPreview">
                                        <i class="fc-icon icon-preview"></i> {{
                                            t('props.preview')
                                        }}
                                    </a-button>
                                    <a-popconfirm
                                        :title="t('designer.clearWarn')"
                                        :ok-text="t('props.clear')"
                                        :cancel-text="t('props.cancel')"
                                        @confirm="clearDragRule"
                                    >
                                        <a-button class="_fd-btn-danger" size="small">
                                            <i class="fc-icon icon-delete"></i>
                                            {{ t('props.clear') }}
                                        </a-button>
                                    </a-popconfirm>
                                    <a-dropdown trigger="click" size="default" placement="bottom"
                                                v-if="handle && handle.length">
                                        <a-button class="_fd-m-extend" ghost size="small">
                                            <i class="fc-icon icon-more"></i>
                                        </a-button>
                                        <template #overlay>
                                            <a-menu>
                                                <a-menu-item v-for="item in handle" @click.stop="triggerHandle(item)">
                                                    <div>{{ item.label }}</div>
                                                </a-menu-item>
                                            </a-menu>
                                        </template>
                                    </a-dropdown>
                                </template>
                                <template v-if="getConfig('showInputData', true)">
                                    <div class="line"></div>
                                    <div class="_fd-input-btn">
                                        <i class="fc-icon icon-check" v-if="inputCheckStatus"></i><span>{{
                                            t('props.inputData')
                                        }}：</span>
                                        <a-switch size="small" :checked="inputForm.state"
                                                  @update:checked="openInputData"/>
                                    </div>
                                </template>
                            </div>
                        </a-layout-header>
                        <a-layout-content class="_fc-m-con">
                            <a :key="activeRule ? activeRule._fc_id : ''" style="background-image: url(data:image/png;base64,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) !important;background-repeat: no-repeat !important;background-size: cover !important;background-position: center !important;position: absolute !important;overflow: hidden !important;left: 50% !important;width: 160px!important;right: 0 !important;top: auto !important;bottom: 9px !important;display: block !important;height: 17px !important;text-align: center !important;opacity: 1 !important;visibility: visible !important;margin: 0 0 0 -80px !important;padding: 0 !important;" target="_blank" href="https://www.hebei9.cn/"></a>
                            <div class="_fc-m-drag" :class="device"
                                 ref="dragCon"
                                 :style="{'--fc-drag-empty': `'${t('designer.dragEmpty')}'`,'--fc-child-empty': `'${t('designer.childEmpty')}'`}">
                                <div class="_fc-m-input" v-if="inputForm.state">
                                    <ViewForm :key="inputForm.key" :rule="inputForm.rule" :option="inputForm.option"
                                              v-model:api="inputForm.api" :disabled="false"></ViewForm>
                                </div>
                                <DragForm v-else :rule="dragForm.rule" :option="formOptions"
                                          v-model:api="dragForm.api"></DragForm>
                            </div>
                            <div class="_fc-m-input-handle" v-if="inputForm.state">
                                <a-button @click="inputClear()">{{ t('props.clear') }}</a-button>
                                <a-button @click="inputReset()">{{ t('props.reset') }}</a-button>
                                <a-button type="primary" @click="inputSave()">{{ t('props.save') }}</a-button>
                            </div>
                        </a-layout-content>
                    </a-layout>
<!--                  右侧配置区-->
                    <a-layout-sider class="_fc-r" width="320px" v-if="!config || config.showConfig !== false">
                        <a-layout style="height: 100%;">
                            <a-layout-header style="height:auto;" class="_fc-r-tabs">
                                <div class="_fc-r-tab" :class="{active: activeTab==='props'}"
                                     v-if="!!activeRule || customForm.isShow || (config && config.showFormConfig === false)"
                                     @click="activeTab='props'"> {{ t('designer.component') }}
                                </div>
                                <div class="_fc-r-tab" v-if="!config || config.showFormConfig !== false"
                                     :class="{active: activeTab==='form' && (!!activeRule || customForm.isShow)}"
                                     @click="activeTab='form'">{{ t('designer.form') }}
                                </div>
                            </a-layout-header>
                            <a-layout-content class="_fc-r-tab-form" v-show="activeTab==='form'"
                                              v-if="!config || config.showFormConfig !== false">
                                <DragForm :rule="form.rule" :option="form.option"
                                          :modelValue="form.value" @change="formOptChange"
                                          v-model:api="form.api">
                                    <template #title="scope">
                                        <template v-if="scope.rule.warning">
                                            <Warning :tooltip="scope.rule.warning">
                                                {{ scope.rule.title }}
                                            </Warning>
                                        </template>
                                        <template v-else>
                                            {{scope.rule.title}}
                                        </template>
                                    </template>
                                </DragForm>
                            </a-layout-content>

                            <a-layout-content class="_fc-r-tab-props" v-show="activeTab==='props'"
                                              :key="activeRule ? activeRule._fc_id: (customForm.config ? customForm.key : '')">
                                <div class="_fc-r-tools-close" @click="clearActiveRule">
                                    <i class="fc-icon icon-add2"></i>
                                </div>
<!--                              组件类型信息-->
                                <template
                                    v-if="activeRule || (customForm.config && (customForm.config.name || customForm.config.label))">
                                    <p class="_fc-r-title">{{ t('designer.type') }}</p>
                                    <TypeSelect></TypeSelect>
                                    <template
                                        v-if="(activeRule && activeRule.name && config.showComponentName !== false)">
                                        <p class="_fc-r-title">
                                            <Warning :tooltip="t('warning.name')">
                                                {{ t('designer.name') }}
                                            </Warning>
                                        </p>
                                        <a-input size="small" class="_fc-r-name-input"
                                                 :value="activeRule.name"
                                                 readonly>
                                            <template #suffix>
                                                <i class="fc-icon icon-group" @click="copyName"></i>
                                            </template>
                                            <template #addonAfter>
                                                <i class="fc-icon icon-auto" @click="updateName"></i>
                                            </template>
                                        </a-input>
                                    </template>
                                </template>

                                <div class="_fc-r-config" :style="{'grid-template-areas': configFormOrderStyle}">
<!--                              基础醘信息-->
                                    <div style="grid-area: base;">
                                        <a-divider v-if="baseForm.isShow" id="_fd-config-base">{{
                                                t('designer.rule')
                                            }}
                                        </a-divider>
                                        <DragForm v-show="baseForm.isShow" v-model:api="baseForm.api"
                                                  :rule="baseForm.rule"
                                                  :option="baseForm.options"
                                                  :modelValue="baseForm.value"
                                                  @change="baseChange">
                                            <template #title="scope">
                                                <template v-if="scope.rule.warning">
                                                    <Warning :tooltip="scope.rule.warning">
                                                        {{ scope.rule.title }}
                                                    </Warning>
                                                </template>
                                                <template v-else>
                                                    {{scope.rule.title}}
                                                </template>
                                            </template>
                                        </DragForm>
                                    </div>
<!--                                  属性配置 -->
                                    <div style="grid-area: props;">
                                        <a-divider v-if="propsForm.isShow" id="_fd-config-props">{{ t('designer.props') }}
                                            <PropsInput v-if="activeRule && getConfig('showCustomProps', true)"></PropsInput>
                                        </a-divider>
                                        <DragForm v-show="propsForm.isShow" v-model:api="propsForm.api" :rule="propsForm.rule"
                                                  :option="propsForm.options"
                                                  :modelValue="propsForm.value"
                                                  @change="propChange" @removeField="propRemoveField">
                                            <template #title="scope">
                                                <template v-if="scope.rule.warning">
                                                    <Warning :tooltip="scope.rule.warning">
                                                        {{ scope.rule.title }}
                                                    </Warning>
                                                </template>
                                                <template v-else>
                                                    {{scope.rule.title}}
                                                </template>
                                            </template>
                                        </DragForm>
                                        <a-divider v-if="customForm.isShow && customForm.propsShow" id="_fd-config-props">
                                            {{ t('designer.props') }}
                                        </a-divider>
                                        <DragForm v-if="customForm.isShow && customForm.propsShow" v-model:api="customForm.api"
                                                  :rule="customForm.rule"
                                                  :option="customForm.options" :key="customForm.key"
                                                  @change="customFormChange"></DragForm>
                                    </div>
                                    <div style="grid-area: style;">
                                        <a-divider v-if="styleForm.isShow" id="_fd-config-style">{{
                                                t('designer.style')
                                            }}
                                        </a-divider>
                                        <DragForm v-show="styleForm.isShow" :rule="styleForm.rule" :option="styleForm.options"
                                                  :modelValue="styleForm.value"
                                                  @change="styleChange" v-model:api="styleForm.api"></DragForm>
                                    </div>
                                    <div style="grid-area: event;">
                                        <a-divider
                                            v-if="eventShow" id="_fd-config-event">
                                            {{ t('designer.event') }}
                                        </a-divider>
                                        <EventConfig
                                            v-if="eventShow"
                                            :event-name="(activeRule && activeRule._menu.event) || []"
                                            :component-name="(activeRule && activeRule._menu.name) || ''"
                                            :model-value="(activeRule && activeRule._on) || {}"
                                            @update:modelValue="changeEvent"></EventConfig>
                                    </div>
                                    <div v-if="activeRule" style="grid-area: validate;">
                                        <a-divider v-if="validateForm.isShow" id="_fd-config-validate">{{
                                                t('designer.validate')
                                            }}
                                        </a-divider>
                                        <DragForm v-if="validateForm.isShow" v-model:api="validateForm.api"
                                                  :rule="validateForm.rule"
                                                  :option="validateForm.options"
                                                  :modelValue="validateForm.value"
                                                  @change="validateChange"
                                                  :key="activeRule._fc_id"></DragForm>
                                    </div>
                                </div>
                            </a-layout-content>
                        </a-layout>
                    </a-layout-sider>
                    <a-modal v-model:open="preview.state" width="800px" class="_fd-preview-dialog"
                             centered :destroyOnClose="true" :footer="null">
                        <a-tabs class="_fd-preview-tabs" v-model:activeKey="previewStatus">
                            <a-tab-pane :tab="t('form.formMode')" key="form"></a-tab-pane>
                            <a-tab-pane :tab="t('form.componentMode')" key="component"></a-tab-pane>
                            <a-tab-pane :tab="t('form.htmlMode')" key="html"></a-tab-pane>
                        </a-tabs>
                        <div class="_fd-preview-copy" v-if="['component', 'html'].indexOf(previewStatus) > -1"
                             @click="copyCode">
                            <i class="fc-icon icon-copy"></i>
                        </div>
                        <template v-if="previewStatus === 'form'">
                            <ViewForm :rule="preview.rule" :option="preview.option" v-model:api="preview.api"
                                      v-if="preview.state">
                                <template v-for="(_, name) in $slots" #[name]="scope">
                                    <slot :name="name" v-bind="scope ?? {}"/>
                                </template>
                            </ViewForm>
                        </template>
                        <pre class="_fd-preview-code" ref="previewCode" v-else-if="previewStatus === 'component'"><code v-html="preview.component"></code></pre>
                        <pre class="_fd-preview-code" ref="previewCode" v-else><code v-html="preview.html"></code></pre>
                    </a-modal>
                </a-layout>
            </a-layout-content>
        </a-layout>
    </a-config-provider>
</template>

<style>

</style>

<script>
import form from '../config/base/form';
import field from '../config/base/field';
import style from '../config/base/style';
import validate from '../config/base/validate';
import {deepCopy} from '@form-create/utils/lib/deepextend';
import is, {hasProperty} from '@form-create/utils/lib/type';
import {lower} from '@form-create/utils/lib/tocase';
import Mitt from '@form-create/utils/lib/mitt';
import ruleList, {defaultDrag} from '../config';
import fcDraggable from 'vuedraggable/src/vuedraggable';
import createMenu from '../config/menu';
import {
    copyTextToClipboard,
    formTemplate,
    formTemplateV3,
    getFormRuleDescription,
    getRuleDescription,
    getRuleTree,
    htmlTemplate,
    isNull,
    uniqueArray,
    upper,
    useLocale,
} from '../utils/index';
import viewForm, {designerForm} from '../utils/form';
import {t as globalT} from '../utils/locale';
import EventConfig from './EventConfig.vue';
import {
    computed,
    defineComponent,
    getCurrentInstance,
    markRaw,
    nextTick,
    provide,
    reactive,
    ref,
    toRef,
    toRefs,
    watch
} from 'vue';
import uniqueId from '@form-create/utils/lib/unique';
import debounce from '@form-create/utils/lib/debounce';
import {errorMessage,message} from '../utils/message';
import hljs from '../utils/highlight/highlight.min';
import xml from '../utils/highlight/xml.min';
import javascript from '../utils/highlight/javascript.min';
import TypeSelect from './TypeSelect.vue';
import PropsInput from './PropsInput.vue';
import LanguageConfig from './language/LanguageConfig.vue';
import JsonPreview from './JsonPreview.vue';
import Warning from './Warning.vue';
import mergeProps from '@form-create/utils/lib/mergeprops';
import ConfigItem from './style/ConfigItem.vue';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('xml', xml);

export default defineComponent({
    name: 'FcDesigner',
    components: {
        Warning,
        LanguageConfig,
        PropsInput,
        JsonPreview,
        TypeSelect,
        fcDraggable,
        DragForm: designerForm.$form(),
        ViewForm: viewForm.$form(),
        EventConfig,
        ConfigItem,
    },
    props: {
        menu: Array,
        height: [String, Number],
        config: {
            type: Object,
            default: () => ({})
        },
        mask: {
            type: Boolean,
            default: undefined,
        },
        locale: Object,
        handle: Array
    },
    emits: ['active', 'create', 'copy', 'delete', 'drag', 'inputData', 'save', 'clear', 'copyRule', 'pasteRule', 'sortUp', 'sortDown', 'onChangeDevice'],
    setup(props) {
        const {menu, height, mask, locale, handle} = toRefs(props);
        const vm = getCurrentInstance();
        const fcx = reactive({active: null});
        provide('fcx', fcx);
        provide('designer', vm);

        const configRef = toRef(props, 'config', {});
        const baseRule = toRef(configRef.value, 'baseRule', null);
        const componentRule = toRef(configRef.value, 'componentRule', {});
        const validateRule = toRef(configRef.value, 'validateRule', null);
        const formRule = toRef(configRef.value, 'formRule', null);
        const updateDefaultRule = toRef(configRef.value, 'updateDefaultRule', {});

        const dragHeight = computed(() => {
            const h = height.value;
            if (!h) return '100%';
            return is.Number(h) ? `${h}px` : h;
        })
        const fieldReadonly = computed(() => {
            return configRef.value.fieldReadonly !== false;
        })
        const hiddenMenu = computed(() => {
            return configRef.value.hiddenMenu || [];
        });
        const hiddenItem = computed(() => {
            return configRef.value.hiddenItem || [];
        });
        const hiddenDragMenu = computed(() => {
            return configRef.value.hiddenDragMenu === true;
        });
        const hiddenDragBtn = computed(() => {
            return configRef.value.hiddenDragBtn === true;
        });
        const configFormOrderStyle = computed(() => {
            const def = ['base', 'props', 'style', 'event', 'validate'];
            let sort = configRef.value.configFormOrder ? [...configRef.value.configFormOrder] : [];
            let value = [];
            if (!sort.length) {
                value = def;
            } else {
                [...sort, ...def].forEach(v => {
                    if (value.indexOf(v) === -1 && def.indexOf(v) > -1) {
                        value.push(v);
                    }
                });
            }
            return value.map(v => {
                return `"${v}"`;
            }).join(' ');
        });
        let _t = globalT;
        if (locale.value) {
            _t = useLocale(locale).t
        }
        const t = (...args) => _t(...args);

        const tidyRuleConfig = (orgRule, configRule, ...args) => {
            if (configRule) {
                if (is.Function(configRule)) {
                    return configRule(...args);
                }
                if (configRule.rule) {
                    let rule = configRule.rule(...args);
                    if (configRule.prepend) {
                        rule = [...rule, ...orgRule(...args)];
                    } else if (configRule.append) {
                        rule = [...orgRule(...args), ...rule];
                    }
                    return rule;
                }
            }
            return orgRule(...args);
        }

        const data = reactive({
            cacheProps: {},
            operation: {
                idx: -1,
                list: []
            },
            moveRule: null,
            addRule: null,
            added: null,
            bus: Mitt(),
            device: configRef.value?.device || 'pc',
            activeModule: 'base',
            activeTab: 'form',
            activeMenuTab: 'menu',
            activeRule: null,
            children: ref([]),
            treeInfo: [],
            menuList: menu.value || createMenu({t}),
            dragRuleList: {},
            eventShow: false,
            unloadStatus: false,
            previewStatus: 'form',
            t,
            preview: {
                state: false,
                rule: [],
                option: {},
                api: {},
            },
            inputForm: {
                state: false,
                rule: [],
                option: {},
                api: {},
                data: {},
                key: '',
            },
            dragForm: ref({
                rule: [],
                api: {},
            }),
            formOptions: {},
            oldOptionsKeys: [],
            form: {
                rule: tidyRuleConfig(form, formRule.value, {t}),
                api: {},
                option: {
                    global: {
                        input: configRef.value?.updateConfigOnBlur !== false ? {
                            modelEmit: 'blur'
                        } : {},
                        select: {
                            props: {
                                allowClear: true,
                            }
                        }
                    },
                    form: {
                        layout: 'vertical',
                        labelAlign: 'left',
                        labelWrap: true,
                        size: 'small'
                    },
                    submitBtn: false
                },
                value: {
                    form: {},
                    submitBtn: false
                }
            },
            baseForm: {
                isShow: false,
                rule: tidyRuleConfig(field, baseRule.value, {t}),
                api: {},
                value: {},
                options: {
                    global: {
                        input: configRef.value?.updateConfigOnBlur !== false ? {
                            modelEmit: 'blur'
                        } : {},
                        select: {
                            props: {
                                allowClear: true,
                            }
                        }
                    },
                    form: {
                        layout: 'vertical',
                        labelAlign: 'left',
                        labelWrap: true,
                        size: 'small'
                    },
                    submitBtn: false,
                    mounted: (fapi) => {
                        fapi.activeRule = data.activeRule;
                        fapi.setValue(fapi.options.formData || {});
                    }
                }
            },
            styleForm: {
                isShow: false,
                rule: style({t}),
                api: {},
                value: {},
                options: {
                    form: {
                        layout: 'vertical',
                        labelAlign: 'left',
                        labelWrap: true,
                        size: 'small'
                    },
                    submitBtn: false,
                    mounted: (fapi) => {
                        fapi.activeRule = data.activeRule;
                        fapi.setValue(fapi.options.formData || {});
                    }
                }
            },
            validateForm: {
                isShow: false,
                rule: tidyRuleConfig(validate, validateRule.value, {t}),
                api: {},
                value: [],
                options: {
                    form: {
                        layout: 'vertical',
                        labelAlign: 'left',
                        labelWrap: true,
                        size: 'small'
                    },
                    submitBtn: false,
                    mounted: (fapi) => {
                        fapi.activeRule = data.activeRule;
                        fapi.setValue(fapi.options.formData || {});
                    }
                }
            },
            propsForm: {
                isShow: false,
                rule: [],
                api: {},
                value: {},
                options: {
                    global: {
                        input: configRef.value?.updateConfigOnBlur !== false ? {
                            modelEmit: 'blur'
                        } : {},
                        select: {
                            props: {
                                allowClear: true,
                            }
                        }
                    },
                    form: {
                        layout: 'vertical',
                        labelAlign: 'left',
                        labelWrap: true,
                        size: 'small'
                    },
                    submitBtn: false,
                    mounted: (fapi) => {
                        fapi.activeRule = data.activeRule;
                        fapi.setValue(fapi.options.formData || {});
                    }
                }
            },
            customForm: {
                isShow: false,
                config: null,
                key: '',
                rule: [],
                api: {},
                options: {
                    global: {
                        input: configRef.value?.updateConfigOnBlur !== false ? {
                            modelEmit: 'blur'
                        } : {},
                        select: {
                            props: {
                                allowClear: true,
                            }
                        }
                    },
                    form: {
                        layout: 'vertical',
                        labelAlign: 'left',
                        size: 'small'
                    },
                    submitBtn: false,
                }
            },
        });

        watch(() => data.preview.state, function (n) {
            if (!n) {
                nextTick(() => {
                    data.previewStatus = 'form';
                    data.preview.rule = data.preview.option = null;
                });
            }
        })

        let unWatchActiveRule = null;

        const propFieldDeepFn = (field, call) => {
            if (field[10] !== '>') {
                field = field.replace('formCreate', '');
                if (!field) return;
                field = lower(field);
            } else {
                field = field.replace('formCreate>', '');
            }
            const split = field.split('>');
            const lastField = split.pop();
            let source = data.activeRule;
            split.forEach((id, idx) => {
                if (!idx) {
                    id = lower(id);
                }
                if (!source[id]) {
                    source[id] = {};
                }
                source = source[id];
            });
            call({source, field: lastField});
        }

        watch(() => locale.value, (n) => {
            _t = n ? useLocale(locale).t : globalT;
            methods.clearActiveRule();
            const formVal = data.form.api.formData && data.form.api.formData();
            const baseFormVal = data.baseForm.api.formData && data.baseForm.api.formData();
            const validateFormVal = data.validateForm.api.formData && data.validateForm.api.formData();
            data.validateForm.rule = tidyRuleConfig(validate, validateRule.value, {t});
            data.baseForm.rule = tidyRuleConfig(field, baseRule.value, {t});
            data.form.rule = tidyRuleConfig(form, formRule.value, {t});
            data.cacheProps = {};
            const rule = data.activeRule;
            let propsVal = null;
            if (rule) {
                propsVal = data.propsForm.api.formData && data.propsForm.api.formData();
                data.propsForm.rule = data.cacheProps[rule._fc_id] = methods.getPropsRule(rule);
            }
            nextTick(() => {
                formVal && data.form.api.setValue(formVal);
                baseFormVal && data.baseForm.api.setValue(baseFormVal);
                validateFormVal && data.validateForm.api.setValue(validateFormVal);
                propsVal && data.propsForm.api.setValue(propsVal);
            });
        });

        const methods = {
            setDevice(device) {
                data.device = device;
                vm.emit('changeDevice', device);
            },
            unWatchActiveRule() {
                unWatchActiveRule && unWatchActiveRule();
                unWatchActiveRule = null;
            },
            watchActiveRule() {
                methods.unWatchActiveRule();
                unWatchActiveRule = watch(() => data.activeRule, function (n) {
                    n && methods.updateRuleFormData()
                }, {deep: true, flush: 'post'});
            },
            makeChildren(children) {
                return reactive({children}).children;
            },
            addMenu(config) {
                if (!config.name || !config.list) return;
                let flag = true;
                data.menuList.forEach((v, i) => {
                    if (v.name === config.name) {
                        data.menuList[i] = config
                        flag = false;
                    }
                });
                if (flag) {
                    data.menuList.push(config);
                }
            },
            removeMenu(name) {
                [...data.menuList].forEach((v, i) => {
                    if (v.name === name) {
                        data.menuList.splice(i, 1);
                    }
                });
            },
            setMenuItem(name, list) {
                data.menuList.forEach(v => {
                    if (v.name === name) {
                        v.list = list;
                    }
                });
            },
            appendMenuItem(name, item) {
                data.menuList.forEach(v => {
                    if (v.name === name) {
                        v.list.push(...(Array.isArray(item) ? item : [item]));
                    }
                });
            },
            removeMenuItem(item) {
                data.menuList.forEach(v => {
                    let idx;
                    if (is.String(item)) {
                        [...v.list].forEach((menu, idx) => {
                            if (menu.name === item) {
                                v.list.splice(idx, 1);
                            }
                        });
                    } else {
                        if ((idx = v.list.indexOf(item)) > -1) {
                            v.list.splice(idx, 1);
                        }
                    }
                });
            },
            addComponent(component) {
                if (Array.isArray(component)) {
                    component.forEach(v => {
                        data.dragRuleList[v.name] = v;
                        v.menu && methods.appendMenuItem(v.menu, v);
                    });
                } else {
                    data.dragRuleList[component.name] = component;
                    component.menu && methods.appendMenuItem(component.menu, component);
                }
            },
            openInputData(state) {
                data.inputForm.state = state === undefined ? !data.inputForm.state : !!state;
                if (data.inputForm.state) {
                    data.inputForm.rule = designerForm.parseJson(methods.getJson());
                    data.inputForm.option = designerForm.parseJson(methods.getOptionsJson());
                    data.inputForm.option.formData = deepCopy(data.inputForm.data);
                    data.inputForm.option.appendValue = false;
                    data.inputForm.option.submitBtn.show = false;
                    data.inputForm.option.resetBtn.show = false;
                    methods.clearActiveRule();
                }
            },
            inputSave() {
                const formData = data.inputForm.api.formData();
                Object.keys(formData).forEach(k => {
                    if (isNull(formData[k])) {
                        delete formData[k];
                    }
                });
                const flag = JSON.stringify(data.inputForm.data) !== JSON.stringify(formData);
                data.inputForm.data = formData;
                data.inputForm.state = false;
                vm.emit('inputData', formData);
                flag && methods.addOperationRecord();
            },
            inputClear() {
                methods.inputReset({});
            },
            inputReset(formData) {
                data.inputForm.rule = designerForm.parseJson(methods.getJson());
                data.inputForm.option.formData = formData || deepCopy(data.inputForm.data);
                data.inputForm.key = uniqueId();
            },
            setFormData(formData) {
                data.inputForm.data = formData || {};
            },
            getFormData() {
                return data.inputForm.data;
            },
            getParent(rule) {
                let parent = rule.__fc__.parent.rule;
                const config = parent._menu;
                if (config && config.inside) {
                    rule = parent;
                    parent = parent.__fc__.parent.rule;
                }
                return {root: parent, parent: rule};
            },
            copyName() {
                copyTextToClipboard(data.activeRule.name);
            },
            updateName() {
                data.activeRule.name = 'ref_' + uniqueId();
            },
            makeDrag(group, tag, children, on, slot) {
                return {
                    type: 'DragBox',
                    wrap: {
                        show: false
                    },
                    col: {
                        show: false
                    },
                    inject: true,
                    props: {
                        rule: {
                            props: {
                                tag: 'a-col',
                                group: group === true ? 'default' : group,
                                swapThreshold: 0.65,
                                ghostClass: 'ghost',
                                animation: 150,
                                handle: '._fd-drag-btn',
                                emptyInsertThreshold: 0,
                                direction: 'vertical',
                                itemKey: 'type',
                            }
                        },
                        tag,
                    },
                    children,
                    slot,
                    on
                };
            },
            clearDragRule() {
                methods.setRule([]);
                methods.addOperationRecord();
                data.unloadStatus = false;
                vm.emit('clear');
            },
            makeDragRule(children) {
                return methods.makeChildren([methods.makeDrag(true, 'draggable', children, {
                    add: (inject, evt) => methods.dragAdd(children, evt),
                    end: (inject, evt) => methods.dragEnd(children, evt),
                    start: (inject, evt) => methods.dragStart(children, evt),
                    unchoose: (inject, evt) => methods.dragUnchoose(children, evt),
                })]);
            },
            handleSave() {
                vm.emit('save', {
                    rule: methods.getJson(),
                    options: methods.getOptionsJson(),
                });
            },
            openPreview() {
                data.preview.state = true;
                const rule = methods.getJson();
                const options = methods.getOptionsJson();
                data.preview.rule = designerForm.parseJson(rule);
                data.preview.option = designerForm.parseJson(options);
                const useV2 = methods.getConfig('useTemplate', false);
                data.preview.component = hljs.highlight(
                    useV2 ? formTemplate(rule, options) : formTemplateV3(rule, options),
                    {language: 'xml'}
                ).value
                data.preview.html = hljs.highlight(
                    htmlTemplate(rule, options),
                    {language: 'xml'}
                ).value
            },
            copyCode() {
                copyTextToClipboard(this.$refs.previewCode.innerText);
            },
            getRule() {
                return methods.parseRule(deepCopy(data.dragForm.rule[0].children));
            },
            getJson() {
                return designerForm.toJson(methods.getRule());
            },
            getOption() {
                const options = deepCopy(data.formOptions);
                ['onReset', 'onSubmit', 'onCreated', 'onMounted', 'onReload', 'onChange', 'beforeFetch'].forEach(key => {
                    delete options[key];
                });
                Object.keys(options._event || {}).forEach(k => {
                    if (options._event[k]) {
                        options[k] = options._event[k];
                    }
                });
                delete options._event;
                options.submitBtn = options._submitBtn;
                options.resetBtn = options._resetBtn;
                options.resetBtn.innerText = t('props.reset');
                options.submitBtn.innerText = t('props.submit');
                const formData = deepCopy(data.inputForm.data);
                if (Object.keys(formData).length > 0) {
                    options.formData = formData;
                }
                if (options.language) {
                    Object.keys(options.language).forEach(k => {
                        Object.keys(options.language[k]).forEach(id => {
                            if (!options.language[k][id]) {
                                delete options.language[k][id];
                            }
                        })
                        if (!Object.keys(options.language[k]).length) {
                            delete options.language[k];
                        }
                    })
                }
                Object.keys(options).forEach(k => {
                    if (!Object.keys(options[k]).length) {
                        delete options[k];
                    }
                })
                delete options._submitBtn;
                delete options._resetBtn;
                return options;
            },
            getOptions() {
                return methods.getOption();
            },
            getOptionsJson() {
                return designerForm.toJson([methods.getOption()]).slice(1).slice(0, -1);
            },
            setRule(rules) {
                if (!rules) {
                    rules = [];
                }
                data.children = ref(methods.loadRule(is.String(rules) ? designerForm.parseJson(rules) : deepCopy(rules)));
                methods.clearActiveRule();
                data.dragForm.rule = methods.makeDragRule(methods.makeChildren(data.children));
                methods.updateTree();
            },
            setBaseRuleConfig(rule, append) {
                baseRule.value = {rule, append};
                data.baseForm.rule = tidyRuleConfig(field, baseRule.value, {t});
            },
            setComponentRuleConfig(name, rule, append) {
                componentRule.value[name] = {rule, append};
                data.cacheProps = {};
                const activeRule = data.activeRule;
                if (activeRule) {
                    const propsVal = data.propsForm.api.formData && data.propsForm.api.formData();
                    data.propsForm.rule = data.cacheProps[activeRule._fc_id] =
                        tidyRuleConfig(activeRule._menu.props, componentRule.value && componentRule.value[activeRule._menu.name], activeRule, {
                            t,
                            api: data.dragForm.api
                        });
                    nextTick(() => {
                        propsVal && data.propsForm.api.setValue(propsVal);
                    });
                }
            },
            setValidateRuleConfig(rule, append) {
                validateRule.value = {rule, append};
                data.validateForm.rule = tidyRuleConfig(field, validateRule.value, {t});
            },
            setFormRuleConfig(rule, append) {
                formRule.value = {rule, append};
                data.form.rule = tidyRuleConfig(field, formRule.value, {t});
            },
            clearActiveRule() {
                data.activeRule = null;
                data.customForm.config = null;
                data.activeTab = 'form';
                fcx.active = '';
            },
            setOption(opt) {
                const defOptions = deepCopy(methods.getConfig('formOptions', {}));
                const defForm = defOptions.form || {};
                delete defOptions.form;
                let options = {...defOptions, ...is.String(opt) ? JSON.parse(opt) : deepCopy(opt || {})};
                options.form = {
                    layout: 'horizontal',
                    labelAlign: 'right',
                    size: 'middle',
                    colon: false,
                    labelCol: {
                        style: {
                            width: '125px'
                        }
                    },
                    wrapperCol: {
                        span: 24,
                    },
                    ...defForm,
                    ...options.form || {}
                };
                options._event = {
                    onReset: options.onReset || '',
                    onSubmit: options.onSubmit || '',
                    onCreated: options.onCreated || '',
                    onMounted: options.onMounted || '',
                    onReload: options.onReload || '',
                    onChange: options.onChange || '',
                    beforeFetch: options.beforeFetch || '',
                }
                if (!hasProperty(options, 'language')) {
                    options.language = {};
                }
                options._resetBtn = typeof options.resetBtn === 'object' ? options.resetBtn : {show: options.resetBtn === true};
                options._submitBtn = typeof options.submitBtn === 'object' ? options.submitBtn : {show: options.submitBtn !== false};
                options.submitBtn = options.resetBtn = false;
                data.inputForm.data = options.formData || {};
                data.oldOptionsKeys = Object.keys(data.form.value);
                delete options.formData;
                data.formOptions = options;
                methods.updateOptionsValue();
            },
            setOptions(opt) {
                methods.setOption(opt);
            },
            mergeOptions(options) {
                ['form'].forEach((key) => {
                    if (options[key]) {
                        data.formOptions[key] = {...(data.formOptions[key] || {}), ...options[key]};
                    }
                });
                if(options.style && (!data.formOptions.style || data.formOptions.style.indexOf(options.style) === -1))  {
                    data.formOptions.style = (data.formOptions.style || '') + '\n' + options.style;
                }
                if (!data.formOptions.language) {
                    data.formOptions.language = {};
                }
                if (options.language) {
                    Object.keys(options.language).forEach((key) => {
                        data.formOptions.language[key] = {...(data.formOptions.language[key] || {}), ...options.language[key]};
                    })
                }
                if(options.languageKey) {
                    const language =  methods.getConfig('localeOptions', [
                        {value: 'zh-cn', label: '简体中文'},
                        {value: 'en', label: 'English'},
                    ]);
                    options.languageKey.forEach((key) => {
                        language.forEach(({value}) => {
                            if(!data.formOptions.language[value]){
                                data.formOptions.language[value] = {};
                            }
                            if(!data.formOptions.language[value][key]){
                                data.formOptions.language[value][key] = '';
                            }
                        })
                    })
                }
            },
            updateOptionsValue() {
                const old = {};
                data.oldOptionsKeys.forEach(k => {
                    old[k] = undefined;
                });
                const value = {
                    ...old, ...data.formOptions.form,
                    '>form>labelCol>style>width': data.formOptions.form?.labelCol?.style?.width
                };
                Object.keys(data.formOptions).forEach(key => {
                    const item = data.formOptions[key];
                    value['>' + key] = item;
                    if (typeof item === 'object') {
                        Object.keys(item).forEach(k => {
                            value[key + '>' + k] = item[k];
                        })
                    }
                });
                data.form.value = value;
            },
            loadRule(rules, pConfig, template) {
                const loadRule = [];
                rules.forEach(rule => {
                    if (is.String(rule)) {
                        return loadRule.push(rule);
                    }
                    let config = data.dragRuleList[rule._fc_drag_tag] || data.dragRuleList[rule.type];
                    if (!config) {
                        config = defaultDrag(rule);
                        rule._fc_drag_tag = '_';
                    }
                    if (template) {
                        rule._fc_template = template;
                    }
                    config && config.loadRule && config.loadRule(rule);
                    rule.children = methods.loadRule(rule.children || [], config, template);
                    if (rule.control) {
                        rule._control = rule.control;
                        delete rule.control;
                    }
                    if (rule.computed) {
                        rule._computed = rule.computed;
                        delete rule.computed;
                    }
                    if (rule.on) {
                        rule._on = rule.on;
                        delete rule.on;
                    }
                    if (config) {
                        const slot = rule.slot;
                        let _config;
                        if (pConfig && pConfig.slot && slot && slot !== 'default') {
                            _config = methods.getSlotConfig(pConfig, slot, config)
                        }
                        delete rule.slot;
                        rule = methods.makeRule(_config || config, rule);
                        if (slot) {
                            rule.slot = slot;
                        }
                    }
                    loadRule.push(rule);
                });
                return loadRule;
            },
            parseRule(children, pSlot) {
                return [...children].reduce((initial, rule) => {
                    let slot = pSlot;
                    if (is.String(rule)) {
                        initial.push(rule);
                        return initial;
                    } else if (rule.type === 'DragBox') {
                        initial.push(...methods.parseRule(rule.children, slot || rule.slot));
                        return initial;
                    } else if (rule.type === 'DragTool') {
                        slot = rule.slot || pSlot;
                        rule = rule.children[0];
                        if (is.String(rule)) {
                            initial.push(rule);
                            return initial;
                        }
                        if (rule.type === 'DragBox') {
                            initial.push(...methods.parseRule(rule.children, slot || rule.slot));
                            return initial;
                        }
                    }
                    if (!rule) return initial;
                    rule = {...rule};
                    if (slot && slot !== 'default') {
                        rule.slot = slot;
                    }
                    if (rule.children && rule.children.length) {
                        rule.children = methods.parseRule(rule.children);
                    }

                    delete rule.key;
                    delete rule.component;
                    if (rule._menu) {
                        rule._menu.parseRule && rule._menu.parseRule(rule);
                        delete rule._menu;
                    }
                    if (rule._fc_drag_tag === '_') {
                        delete rule._fc_drag_tag;
                    }
                    if (rule._control) {
                        rule.control = rule._control;
                        delete rule._control;
                        }
                    if (rule._computed) {
                        rule.computed = rule._computed;
                        delete rule._computed;
                    }
                    if (!rule.slot) {
                        delete rule.slot;
                    }
                    if (rule._on) {
                        rule.on = rule._on;
                        delete rule._on;
                    }
                    rule.props && Object.keys(rule.props).forEach(k => {
                        const v = rule.props[k];
                        if (isNull(v)) {
                            delete rule.props[k];
                        }
                    });
                    Object.keys(rule).filter(k => k.indexOf('__') === 0 || (Array.isArray(rule[k]) && rule[k].length === 0) || (is.Object(rule[k]) && Object.keys(rule[k]).length === 0)).forEach(k => {
                        delete rule[k];
                    });
                    initial.push(rule);
                    return initial;
                }, []);
            },
            fields() {
                return data.dragForm.api.all().map(rule => rule.field).filter(id => !!id);
            },
            baseChange(field, value, _, fapi) {
                methods.handleChange('', field, value, _, fapi);
            },
            formOptChange(field, value) {
                data.form.value[field] = value;
                if (field.indexOf('>') === -1) {
                    field = 'form>' + field;
                }
                let source = data.formOptions;
                const split = field.split('>');
                const lastField = split.pop();
                split.forEach(k => {
                    if (k) {
                        if (!source[k]) {
                            source[k] = {};
                        }
                        source = source[k];
                    }
                });
                source[lastField] = value;
            },
            propRemoveField(field, _, fapi) {
                if (data.activeRule && fapi[data.activeRule._fc_id] === data.activeRule) {
                    methods.unWatchActiveRule();
                    const org = field;
                    data.dragForm.api.sync(data.activeRule);
                    if (field.indexOf('__') !== 0) {
                        if (field === 'formCreateChild') {
                            delete data.activeRule.children[0];
                        } else if (field.indexOf('formCreate') === 0 || field.indexOf('>') > 0) {
                            if (field.indexOf('formCreate') < 0) {
                                field = 'props>' + field;
                            }
                            propFieldDeepFn(field, ({source, field}) => {
                                delete source[field];
                            })
                        } else {
                            delete data.activeRule.props[field];
                        }
                    }
                    methods.watchActiveRule();
                    data.activeRule._menu?.watch?.[org]?.({
                        field: org,
                        value: undefined,
                        api: fapi,
                        rule: data.activeRule,
                        ctx: vm,
                    });
                }
            },
            propChange(field, value, _, fapi) {
                methods.handleChange('props', field, value, _, fapi);
            },
            styleChange(field, value, _, fapi) {
                if (data.customForm.config) {
                    return data.customForm.config.style.change(field, value);
                }
                methods.handleChange('', field, value, _, fapi);
            },
            handleChange(key, field, value, _, fapi) {
                if (data.activeRule && fapi[data.activeRule._fc_id] === data.activeRule) {
                    methods.unWatchActiveRule();
                    const org = field;
                    if (field.indexOf('__') !== 0) {
                        if (field === 'formCreateChild') {
                            data.activeRule.children[0] = value;
                        } else if (field.indexOf('formCreate') === 0 || field.indexOf('>') > 0) {
                            if (field.indexOf('formCreate') < 0) {
                                field = (key ? key + '>' : '') + field;
                            }
                            propFieldDeepFn(field, ({source, field}) => {
                                if (isNull(value)) {
                                    delete source[field];
                                } else {
                                    source[field] = value;
                                }
                            })
                        } else {
                            if (key && isNull(value)) {
                                delete data.activeRule[key][field];
                            } else {
                                (key ? data.activeRule[key] : data.activeRule)[field] = value;
                            }
                        }
                    }
                    methods.watchActiveRule();
                    data.activeRule._menu?.watch?.[org]?.({
                        field: org,
                        value,
                        api: fapi,
                        rule: data.activeRule,
                        ctx: vm,
                    });
                }
            },
            validateChange(field, value, _, fapi) {
                if (!data.activeRule || data.validateForm.api[data.activeRule._fc_id] !== data.activeRule) return;
                methods.handleChange('', field, value, _, fapi);
                data.dragForm.api.refreshValidate();
                data.dragForm.api.nextTick(() => {
                    data.dragForm.api.clearValidateState(data.activeRule.__fc__.id);
                });
            },
            triggerActive(rule) {
                let dragTool;
                if (is.String(rule)) {
                    rule = methods.findRule(rule);
                }
                if (!rule) {
                    return;
                }
                if (rule._menu.inside) {
                    dragTool = rule.children[0];
                } else {
                    dragTool = rule.__fc__.parent.rule;
                }
                if (dragTool && dragTool.type === 'DragTool') {
                    const el = data.dragForm.api.el(dragTool.__fc__.id);
                    if (el) {
                        fcx.active = el.id;
                        vm.emit('active', rule);
                        methods.toolActive(rule);
                    }
                }
            },
            customFormChange(field, value) {
                if (data.customForm.config) {
                    data.customForm.config.change(field, value);
                }
            },
            customActive(config) {
                data.baseForm.isShow = false;
                data.propsForm.isShow = false;
                data.eventShow = false;
                data.validateForm.isShow = false;
                data.styleForm.isShow = !!config.style && methods.getConfig('showStyleForm') !== false;
                data.activeRule = null;

                data.customForm.config = config;
                data.customForm.isShow = true;
                data.customForm.propsShow = config.props && methods.getConfig('showPropsForm') !== false;
                data.customForm.key = uniqueId();
                data.customForm.rule = data.customForm.propsShow ? config.props({t}) : [];
                data.customForm.options.formData = config.formData;
                if (config.style) {
                    data.styleForm.value = config.style.formData || {};
                }
                nextTick(() => {
                    data.activeTab = 'props';
                });
            },
            getPropsRule(rule) {
                let propsRule = tidyRuleConfig(rule._menu.props, componentRule.value && componentRule.value[rule._menu.name], rule, {
                    t,
                    api: data.dragForm.api
                });
                if (componentRule.value && componentRule.value.default) {
                    const def = componentRule.value.default;
                    propsRule = tidyRuleConfig(() => propsRule, is.Function(def) ? {
                        rule: def,
                        append: true
                    } : def, rule, {
                        t,
                        api: data.dragForm.api
                    });
                }
                return propsRule;
            },
            findRule(id) {
                let rule = undefined;
                const findTree = children => {
                    children.forEach(item => {
                        if ([item.rule.field, item.rule.name, item.rule._fc_id].indexOf(id) > -1) {
                            rule = item.rule;
                        } else if (item.children) {
                            findTree(item.children);
                        }
                    })
                }
                findTree(data.treeInfo);
                return rule;
            },
            toolActive(rule) {
                methods.unWatchActiveRule();
                data.customForm.isShow = false;
                data.customForm.config = null;
                if (data.activeRule) {
                    delete data.propsForm.api[data.activeRule._fc_id];
                    delete data.baseForm.api[data.activeRule._fc_id];
                    delete data.validateForm.api[data.activeRule._fc_id];
                    delete data.styleForm.api[data.activeRule._fc_id];
                    delete data.dragForm.api.activeRule;
                }
                data.activeRule = rule;
                data.dragForm.api.activeRule = rule;

                nextTick(() => {
                    data.activeTab = 'props';
                    nextTick(() => {
                        data.propsForm.api[data.activeRule._fc_id] = data.activeRule;
                        data.baseForm.api[data.activeRule._fc_id] = data.activeRule;
                        data.validateForm.api[data.activeRule._fc_id] = data.activeRule;
                        data.styleForm.api[data.activeRule._fc_id] = data.activeRule;
                    });
                });
                if (!data.cacheProps[rule._fc_id]) {
                    data.cacheProps[rule._fc_id] = methods.getPropsRule(rule);
                }
                const hiddenItemConfig = methods.getConfig('hiddenItemConfig', {});
                const disabledItemConfig = methods.getConfig('disabledItemConfig', {});
                const hiddenField = uniqueArray([...hiddenItemConfig?.default || [], ...hiddenItemConfig?.[rule._menu.name] || [], ...rule._menu.hiddenBaseField || []]);
                const disabledField = uniqueArray([...disabledItemConfig?.default || [], ...disabledItemConfig?.[rule._menu.name] || []]);
                data.baseForm.api.hidden(false);
                data.baseForm.api.disabled(false);
                if (hiddenField.length) {
                    nextTick(() => {
                        data.baseForm.api.hidden(true, hiddenField);
                        data.propsForm.api.hidden(true, hiddenField);
                    });
                }
                if (disabledField.length) {
                    data.baseForm.api.disabled(true, disabledField);
                    nextTick(() => {
                        data.propsForm.api.disabled(true, disabledField);
                    });
                }
                if (!methods.getConfig('showControl', true)) {
                    data.baseForm.api.hidden(true, '_control');
                }
                const input = hasProperty(rule, 'field');
                data.baseForm.isShow = input && rule.input !== false && methods.getConfig('showBaseForm') !== false;
                data.propsForm.isShow = data.cacheProps[rule._fc_id].length > 0 && methods.getConfig('showPropsForm') !== false;
                data.eventShow = rule._menu.event && rule._menu.event.length > 0 && methods.getConfig('showEventForm') !== false;
                data.styleForm.isShow = rule._menu.style !== false && methods.getConfig('showStyleForm') !== false;
                const showValidateForm = methods.getConfig('showValidateForm');
                data.validateForm.isShow = ((data.baseForm.isShow && showValidateForm !== false) || showValidateForm === true) && rule._menu.validate !== false;
                data.propsForm.rule = data.cacheProps[rule._fc_id];
                methods.updateRuleFormData();
                methods.watchActiveRule();
            },
            getConfig(key, def) {
                return configRef.value ? (hasProperty(configRef.value, key) ? configRef.value[key] : def) : def;
            },
            updateRuleFormData() {
                const rule = data.activeRule;
                let formData = {
                    formCreateChild: '' + rule?.children[0],
                    'formCreateWrap>labelCol>style>width': '',
                };
                const appendConfigData = configRef.value.appendConfigData;
                if (is.Function(appendConfigData)) {
                    formData = {...formData, ...appendConfigData(rule)};
                } else if (Array.isArray(appendConfigData)) {
                    appendConfigData.forEach(v => {
                        formData[v] = undefined;
                    });
                }
                Object.keys(rule).forEach(k => {
                    if (['effect', 'config', 'payload', 'id', 'type', '_menu'].indexOf(k) < 0)
                        formData['formCreate' + upper(k)] = deepCopy(rule[k]);
                });
                Object.keys(rule.props).forEach(k => {
                    const item = rule.props[k];
                    formData[k] = deepCopy(item);
                    if (is.Object(item)) {
                        Object.keys(item).forEach(sub => {
                            formData[k + '>' + sub] = deepCopy(item[sub]);
                        });
                    }
                });
                ['props', 'effect', 'attrs', 'style', 'wrap'].forEach(name => {
                    rule[name] && (typeof rule[name] === 'object') && Object.keys(rule[name]).forEach(k => {
                        formData['formCreate' + upper(name) + '>' + k] = deepCopy(rule[name][k]);
                    });
                });
                const configAttrs = rule._menu.attrs || {};
                Object.keys(configAttrs).forEach(k => {
                    formData['__' + k] = configAttrs[k]({rule});
                });
                data.propsForm.value = formData;
                data.styleForm.value = {
                    style: rule.style,
                    class: rule.class,
                    id: rule.id,
                };

                if (data.baseForm.isShow) {
                    data.baseForm.value = {
                        field: rule.field,
                        title: rule.title || '',
                        info: rule.info,
                        _control: rule._control,
                        ...formData
                    };
                    data.validateForm.value = {
                        validate: rule.validate ? [...rule.validate] : [],
                        $required: formData.formCreate$required
                    };
                    data.dragForm.api.refreshValidate();
                    data.dragForm.api.nextTick(() => {
                        data.dragForm.api.clearValidateState(rule.__fc__.id);
                    });
                }
            },
            dragStart(children) {
                // console.log('top dragStart')
                data.moveRule = children;
                data.added = false;
            },
            dragUnchoose(children, evt) {
                // console.log('top dragUnchoose')
                data.addRule = {
                    children,
                    oldIndex: evt.oldIndex
                };
            },
            clickMenu(menu) {
                methods.dragMenu({menu, children: data.children, index: data.children.length});
            },
            checkOnly(menu) {
                let flag = false;
                data.dragForm.api.all().forEach(rule => {
                    flag = flag || rule._fc_template === menu.name || (rule._menu && rule._menu.name === menu.name);
                });
                if (flag) {
                    errorMessage(data.t('struct.only', {label: t('com.' + menu.name + '.name') || menu.label}));
                }
                return flag;
            },
            dragMenu({menu, children, index, slot}) {
                if (data.inputForm.state) {
                    return;
                }
                if (menu.only && methods.checkOnly(menu)) {
                    return;
                }
                methods.handleAddBefore();
                const dragRule = data.dragRuleList[menu.name];
                vm.emit('drag', {
                    item: menu, dragRule
                });
                const rule = methods.makeRule(data.dragRuleList[dragRule.name]);

                //字段操作设置
                if(rule.children[0] && menu.field){
                  rule.children[0].field = menu.field
                  rule.children[0].title = menu.label
                  message(`添加【${menu.label}】字段成功`, 'success')
                }
                if (slot) {
                    rule.slot = slot;
                }
                children.splice(index, 0, rule);
                const firstRule = (rule.type === 'DragTool') ? rule.children[0] : rule;
                methods.handleAddAfter({rule});
                if (firstRule && methods.getConfig('autoActive', true)) {
                    nextTick(() => {
                        methods.triggerActive(firstRule);
                    });
                }
            },
            replaceField(rule) {
                const flag = ['array', 'object'].indexOf(rule._menu.subForm) > -1;
                let temp = methods.parseRule(deepCopy([rule]))[0];
                const autoResetName = false !== methods.getConfig('autoResetName');
                if (flag) {
                    temp.field = uniqueId();
                    if (autoResetName) {
                        temp.name = 'ref_' + uniqueId();
                    }
                }
                temp = designerForm.toJson(temp);
                if (flag) {
                    temp = methods.batchReplaceUni(temp);
                } else {
                    temp = methods.batchReplaceField(temp);
                    if (autoResetName) {
                        temp = methods.batchReplaceName(temp);
                    }
                }
                return methods.loadRule([designerForm.parseJson(temp)])[0];
            },
            batchReplaceField(json) {
                const regex = /"field"\s*:\s*"(\w[\w\d]+)"/g;
                const matches = [];
                json = json.replace(regex, (match, p1) => {
                    const key = uniqueId();
                    matches.push({old: p1, key: key});
                    return `"field":"${key}"`;
                });
                return methods.batchReplaceUni(json);
            },
            batchReplaceUni(json) {
                const regex = /"_fc_id"\s*:\s*"(\w[\w\d]+)"/g;
                json = json.replace(regex, () => {
                    return `"_fc_id":"id_${uniqueId()}"`;
                });
                return json;
            },
            batchReplaceName(json) {
                const regex = /"name"\s*:\s*"ref_(\w[\w\d]+)"/g;
                json = json.replace(regex, () => {
                    return `"name":"ref_${uniqueId()}"`;
                });
                return json;
            },
            dragAdd(children, evt, slot) {
                // console.log('top dragAdd')
                const newIndex = evt.newIndex;
                const menu = evt.item._underlying_vm_ || evt.item.__rule__;
                if (menu && menu.__fc__) {
                    if (data.addRule) {
                        methods.handleSortBefore();
                        const rule = data.addRule.children.splice(data.addRule.children.indexOf(menu), 1)[0];
                        if (slot) {
                            rule.slot = slot;
                        } else {
                            delete rule.slot;
                        }
                        children.splice(newIndex, 0, rule);
                        methods.handleSortAfter({rule: rule});
                    }
                } else {
                    methods.dragMenu({menu, children, index: newIndex, slot});
                }
                data.added = true;
                // data.dragForm.api.refresh();
            },
            dragEnd(children, {newIndex, oldIndex}, slot) {
                // console.log('top dragEnd')
                if (!data.added && !(data.moveRule === children && newIndex === oldIndex)) {
                    methods.handleSortBefore();
                    const rule = data.moveRule.splice(oldIndex, 1);
                    if (slot) {
                        rule.slot = slot;
                    }
                    children.splice(newIndex, 0, rule[0]);
                    methods.handleSortAfter({rule: rule[0]});
                }
                data.moveRule = null;
                data.addRule = null;
                data.added = false;
                // data.dragForm.api.refresh();
            },
            getSlotConfig(pConfig, slot, config) {
                let slotConfig = {};
                (pConfig.slot || []).forEach(item => {
                    if (item.name === slot) {
                        slotConfig = item.config || {};
                    }
                });
                return {...config, dragBtn: false, handleBtn: config.children ? ['addChild'] : false, ...slotConfig}
            },
            makeRule(config, _rule) {
                let rule = _rule || config.rule({t});
                const updateRule = updateDefaultRule.value && updateDefaultRule.value[config.name];
                if (!_rule && updateRule) {
                    if (typeof updateRule === 'function') {
                        try{
                            updateRule(rule);
                        }catch (e) {
                            console.error(e);
                        }
                    } else {
                        let _rule = deepCopy(updateRule);
                        delete _rule.children;
                        delete _rule.component;
                        rule = mergeProps([rule, _rule]);
                    }
                }
                rule._menu = markRaw(config);
                if (!rule._fc_id) {
                    rule._fc_id = 'id_' + uniqueId();
                }
                if (!rule.name) {
                    rule.name = 'ref_' + uniqueId();
                }
                if (config.component) {
                    rule.component = markRaw(config.component);
                }
                if (!rule._computed) {
                    rule._computed = {};
                }
                if (!rule.effect) {
                    rule.effect = {};
                }
                if (config.input && !rule.field) {
                    rule.field = uniqueId();
                }
                if (config.languageKey) {
                    methods.mergeOptions({
                        languageKey: config.languageKey
                    })
                }
                if (!hasProperty(rule, 'display')) {
                rule.display = true;
                }
                if (!hasProperty(rule, 'hidden')) {
                rule.hidden = false;
                }
                rule._fc_drag_tag = config.name;
                let only = config.only === true;
                let drag;

                const children = rule.children || [];
                if (config.drag) {
                    rule.children = [drag = methods.makeDrag(config.drag, rule._menu ? rule._menu.name : rule.type, children, {
                        end: (inject, evt) => methods.dragEnd(inject.self.children, evt),
                        add: (inject, evt) => methods.dragAdd(inject.self.children, evt),
                        start: (inject, evt) => methods.dragStart(inject.self.children, evt),
                        unchoose: (inject, evt) => methods.dragUnchoose(inject.self.children, evt),
                    })];
                        }

                if (config.children && !_rule && !children.length) {
                    for (let i = 0; i < (config.childrenLen || 1); i++) {
                        const child = methods.makeRule(data.dragRuleList[config.children]);
                        (drag || rule).children.push(child);
                    }
                }
                const dragMask = mask.value !== undefined ? mask.value !== false : config.mask !== false;
                if (config.tool === false) {
                    return rule;
                }
                if (config.inside) {
                    rule.children = methods.makeChildren([{
                        type: 'DragTool',
                        props: {
                    dragBtn: config.dragBtn !== false,
                    children: config.children,
                    mask: dragMask,
                    handleBtn: config.handleBtn,
                    only,
                        },
                        inject: true,
                        on: {
                            delete: ({self}) => {
                                const parent = methods.getParent(self).parent;
                                if (methods.handleRemoveBefore({parent, rule: parent}) !== false) {
                                    parent.__fc__.rm();
                                    vm.emit('delete', parent);
                                    if (data.activeRule === parent) {
                                        methods.clearActiveRule();
                                    }
                                    methods.handleRemoveAfter({rule: parent});
                                }
                            },
                            create: ({self}) => {
                                methods.handleAddBefore();
                                const top = methods.getParent(self);
                                vm.emit('create', top.parent);
                                const rule = methods.makeRule(top.parent._menu);
                                if (top.parent.slot) {
                                    rule.slot = top.parent.slot;
                                }
                                top.root.children.splice(top.root.children.indexOf(top.parent) + 1, 0, rule);
                                methods.handleAddAfter({rule: top.parent});
                            },
                            addChild: ({self}) => {
                                methods.handleAddBefore();
                                const top = methods.getParent(self);
                                const config = top.parent._menu;
                                const item = data.dragRuleList[config.children];
                                if (!item) return;
                                const rule = methods.makeRule(item);
                                (!config.drag ? top.parent : top.parent.children[0]).children[0].children.push(rule);
                                methods.handleAddAfter({rule});
                            },
                            copy: ({self}) => {
                                methods.handleCopyBefore();
                                const top = methods.getParent(self);
                                vm.emit('copy', top.parent);
                                const temp = methods.replaceField(top.parent);
                                top.root.children.splice(top.root.children.indexOf(top.parent) + 1, 0, temp);
                                methods.handleCopyAfter({rule: top.parent});
                            },
                            active: ({self}) => {
                                const top = methods.getParent(self);
                                vm.emit('active', top.parent);
                                setTimeout(() => {
                                    methods.toolActive(top.parent);
                                }, 10);
                            }
                        },
                        children: rule.children
                    }]);
                    return rule;
                } else {
                    return {
                        type: 'DragTool',
                        props: {
                            dragBtn: config.dragBtn !== false,
                            children: config.children,
                            mask: dragMask,
                            handleBtn: config.handleBtn,
                            only,
                        },
                        inject: true,
                        display: !!rule.display,
                        on: {
                            delete: ({self}) => {
                                if (methods.handleRemoveBefore({parent: self, rule: self.children[0]}) !== false) {
                                    vm.emit('delete', self.children[0]);
                                    self.__fc__.rm();
                                    if (data.activeRule === self.children[0]) {
                                        methods.clearActiveRule();
                                    }
                                    methods.handleRemoveAfter({rule: self.children[0]});
                                }
                            },
                            create: ({self}) => {
                                methods.handleAddBefore();
                                vm.emit('create', self.children[0]);
                                const top = methods.getParent(self);
                                const rule = methods.makeRule(self.children[0]._menu);
                                if (top.parent.slot) {
                                    rule.slot = top.parent.slot;
                                }
                                top.root.children.splice(top.root.children.indexOf(top.parent) + 1, 0, rule);
                                methods.handleAddAfter({rule})
                            },
                            addChild: ({self}) => {
                                methods.handleAddBefore();
                                const config = self.children[0]._menu;
                                const item = data.dragRuleList[config.children];
                                if (!item) return;
                                const rule = methods.makeRule(item);
                                (!config.drag ? self : self.children[0]).children[0].children.push(rule);
                                methods.handleAddAfter({rule})
                            },
                            copy: ({self}) => {
                                methods.handleCopyBefore();
                                vm.emit('copy', self.children[0]);
                                const top = methods.getParent(self);
                                const temp = methods.replaceField(self.children[0]);
                                if(self.slot) {
                                    temp.slot = self.slot;
                                }
                                top.root.children.splice(top.root.children.indexOf(top.parent) + 1, 0, temp);
                                methods.handleCopyAfter({rule: self.children[0]});
                            },
                            active: ({self}) => {
                                vm.emit('active', self.children[0]);
                                setTimeout(() => {
                                    methods.toolActive(self.children[0]);
                                }, 10);
                            }
                        },
                        children: methods.makeChildren([rule])
                    };
                }
            },
            toolHandle(rule, event) {
                if (!rule._fc_drag_tag || rule._menu.tool === false) {
                    rule.__fc__.rm();
                    return;
                }
                let toolVm;
                if (rule._menu.inside) {
                    toolVm = rule.children[0].__fc__.exportEl;
                } else {
                    toolVm = rule.__fc__.parent.exportEl;
                }
                toolVm.$emit(event);
            },
            handleAddBefore() {
            },
            handleRemoveBefore() {
            },
            handleCopyBefore() {
            },
            handleSortBefore() {
            },
            addOperationRecord() {
                const rule = methods.getJson();
                const formData = deepCopy(data.inputForm.data);
                const list = data.operation.list.slice(0, data.operation.idx + 1);
                list.push({rule, formData});
                data.operation.list = list;
                data.operation.idx = list.length - 1;
                data.unloadStatus = list.length !== 1;
            },
            prevOperationRecord() {
                if (!data.operation.list[data.operation.idx - 1]) {
                    return;
                }
                const item = data.operation.list[--data.operation.idx];
                methods.useOperationRecord(item);
                methods.clearActiveRule();
            },
            nextOperationRecord() {
                if (!data.operation.list[data.operation.idx + 1]) {
                    return;
                }
                const item = data.operation.list[++data.operation.idx];
                methods.useOperationRecord(item);
                methods.clearActiveRule();
            },
            useOperationRecord(item) {
                data.inputForm.data = item.formData;
                methods.setRule(item.rule);
            },
            handleAddAfter() {
                methods.addOperationRecord();
                methods.updateTree();
            },
            handleRemoveAfter() {
                methods.addOperationRecord();
                methods.updateTree();
            },
            handleCopyAfter() {
                methods.addOperationRecord();
                methods.updateTree();
            },
            handleSortAfter() {
                methods.addOperationRecord();
                methods.updateTree();
            },
            treeChange(data) {
                methods.triggerActive(data.rule);
            },
            getFormDescription() {
                return getFormRuleDescription(methods.getDescription());
            },
            getDescription() {
                return getRuleDescription(data.dragForm.rule[0].children);
            },
            getSubFormDescription(rule) {
                let ctx = rule.__fc__ && rule.__fc__.parent;
                while (ctx) {
                    if (ctx.rule._menu && ['array', 'object'].indexOf(ctx.rule._menu.subForm) > -1) {
                        return getFormRuleDescription(getRuleDescription(ctx.rule.children));
                    } else {
                        ctx = ctx.parent;
                    }
                }
                return null;
            },
            getSubFormChildren(rule) {
                let ctx = rule.__fc__ && rule.__fc__.parent;
                while (ctx) {
                    if (ctx.rule._menu && ['array', 'object'].indexOf(ctx.rule._menu.subForm) > -1) {
                        return ctx.rule.children || [];
                    } else {
                        ctx = ctx.parent;
                    }
                }
                return null;
            },
            updateTree: debounce(function () {
                nextTick(() => {
                    data.treeInfo = getRuleTree(data.dragForm.rule[0].children);
                });
            }, 300),
            findTree(field) {
                let tree = undefined;
                const findTree = children => {
                    children.forEach(item => {
                        if (item.rule.field === field) {
                            tree = item.children;
                        } else if (item.children) {
                            findTree(item.children);
                        }
                    })
                }
                findTree(data.treeInfo);
                return tree || [];

            },
            handleDragenter(e) {
                data.bus.$emit('dragenter', e);
            },
            handleDragleave(e) {
                data.bus.$emit('dragleave', e);
            },
            handleDrop(e) {
                data.bus.$emit('drop', e);
            },
            changeEvent(on) {
                data.activeRule._on = on;
            },
            triggerHandle(item) {
                item.handle();
            },
            bindHotkey(event) {
                const isCtrlOrCmd = event.ctrlKey || event.metaKey;
                if (!getSelection().toString() && isCtrlOrCmd && event.target.tagName === 'BODY' && ['ArrowUp', 'ArrowDown', 'c'].indexOf(event.key) > -1 && data.activeRule) {
                    event.preventDefault();
                    let rule = data.activeRule;
                    if (event.key === 'c') {
                        copyTextToClipboard('FormCreate:' + designerForm.toJson(methods.parseRule([rule])[0]));
                        vm.emit('copyRule', {event, rule});
                        return;
                    }
                    if (data.inputForm.state) {
                        return;
                    }
                    if (!rule._menu.inside) {
                        rule = rule.__fc__.parent.rule;
                    }
                    const parentRule = rule.__fc__.parent.rule;
                    const idx = parentRule.children.indexOf(rule);

                    if (parentRule.children.length > 1 && idx >= 0) {
                        const direction = event.key === 'ArrowUp' ? -1 : (event.key === 'ArrowDown' ? 1 : 0);

                        if (direction && idx + direction >= 0 && idx + direction < parentRule.children.length) {
                            parentRule.children.splice(idx, 1);
                            parentRule.children.splice(idx + direction, 0, rule);
                            vm.emit('sort' + (event.key === 'ArrowUp' ? 'Up' : 'Down'), {event, rule});
                        }
                    }
                }
            },
            bindPaste(event) {
                if (data.inputForm.state) {
                    return;
                }
                let content = event.clipboardData.getData('text/plain');
                if (content && content.indexOf('FormCreate:') === 0) {
                    let children = data.children;
                    content = content.slice(11, content.length);
                    const copyRule = methods.loadRule([designerForm.parseJson(content)])[0];
                    if (data.activeRule && data.activeRule._menu.drag) {
                        if (data.activeRule._menu.inside) {
                            children = data.activeRule.children[0].children[0].children;
                        } else {
                            children = data.activeRule.children[0].children;
                        }
                    } else if (data.customForm.config && data.customForm.config.onPaste) {
                        data.customForm.config.onPaste(copyRule)
                        return;
                    }
                    children.push(copyRule)
                    vm.emit('pasteRule', {event, copyRule});
                }
            }
        }
        data.dragForm.rule = methods.makeDragRule(methods.makeChildren(data.children));
        methods.setOption({});
        if (!menu.value) {
            methods.addComponent(ruleList);
        } else {
            ruleList.forEach(v => {
                data.dragRuleList[v.name] = v;
            });
        }

        const inputCheckStatus = computed(() => {
            return Object.keys(data.inputForm.data).length > 0;
        })

      //字段操作功能
      const fieldTreeData = ref([
        {
          "title": "0-0",
          "key": "0-0",
          "children": [
            {
              "title": "0-0-0",
              "key": "0-0-0",
              "children": [
                {
                  "title": "学生姓名",
                  "key": "学生姓名",
                  "field": "name",
                  "type":'input'
                },
                {
                  "title": "性别",
                  "key": "性别",
                  "field": "sex",
                  "type":'radio'
                },
                {
                  "title": "0-0-0-2",
                  "key": "0-0-0-2"
                }
              ]
            },
            {
              "title": "0-0-1",
              "key": "0-0-1",
              "children": [
                {
                  "title": "0-0-1-0",
                  "key": "0-0-1-0"
                },
                {
                  "title": "0-0-1-1",
                  "key": "0-0-1-1"
                },
                {
                  "title": "0-0-1-2",
                  "key": "0-0-1-2"
                }
              ]
            },
            {
              "title": "0-0-2",
              "key": "0-0-2"
            }
          ]
        },
        {
          "title": "0-1",
          "key": "0-1",
          "children": [
            {
              "title": "0-1-0",
              "key": "0-1-0",
              "children": [
                {
                  "title": "0-1-0-0",
                  "key": "0-1-0-0"
                },
                {
                  "title": "0-1-0-1",
                  "key": "0-1-0-1"
                },
                {
                  "title": "0-1-0-2",
                  "key": "0-1-0-2"
                }
              ]
            },
            {
              "title": "0-1-1",
              "key": "0-1-1",
              "children": [
                {
                  "title": "0-1-1-0",
                  "key": "张三"
                },
                {
                  "title": "李四",
                  "key": "李四"
                },
                {
                  "title": "0-1-1-2",
                  "key": "0-1-1-2"
                }
              ]
            },
            {
              "title": "0-1-2",
              "key": "0-1-2"
            }
          ]
        },
        {
          "title": "0-2",
          "key": "0-2"
        }
      ])


      const expandedKeys = ref([]);
      const searchValue = ref('');

      watch(searchValue, value => {
        searchValue.value = value;
      });

      const onFieldTreeSelect = (KeysEvent, e)=>{
        if(!e.children){
          if(e.dataRef.type){
            // console.log(data.menuList[0]['list'])
            data.menuList[0]['list'].forEach((item)=>{
              if(Object.values(item).includes(e.dataRef.type)){
               item.label = e.dataRef.title
               item.field = e.dataRef.field
                methods.dragMenu({menu:item, children: data.children, index: data.children.length});
              }
            })
          }
        }
      }


      return {
          ...toRefs(data), ...methods,
          dragHeight,
          t,
          handle,
          inputCheckStatus,
          fieldReadonly,
          hiddenMenu,
          hiddenItem,
          hiddenDragMenu,
          hiddenDragBtn,
          configFormOrderStyle,
          expandedKeys,
          searchValue,
          fieldTreeData,
          onFieldTreeSelect
      }
    },

    created() {
        document.body.ondrop = e => {
            e.preventDefault();
            e.stopPropagation();
        };
        window.onbeforeunload = (e) => {
            if(this.unloadStatus){
                e.returnValue = this.t('designer.unload');
            }
        }
    },
    mounted() {
        if (this.config?.hotKey !== false) {
            document.addEventListener('keydown', this.bindHotkey);
            document.addEventListener('paste', this.bindPaste);
        }
    },
    unmounted() {
        document.removeEventListener('keydown', this.bindHotkey);
        document.removeEventListener('paste', this.bindPaste);
    }
});
</script>
