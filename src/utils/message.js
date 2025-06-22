import {message as AMessage} from 'ant-design-vue';


const message = (msg, type) => {
    return AMessage[type || 'info']({
        content: msg,
    });
};

const errorMessage = (msg,type='error') => {
    return message(msg, type);

};

export default errorMessage;

export {message}