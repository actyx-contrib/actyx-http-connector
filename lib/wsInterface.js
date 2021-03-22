"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mkData = exports.mkError = void 0;
exports.mkError = function (fish, props, message) { return ({
    type: 'error',
    fish: fish,
    props: props,
    data: { message: message },
}); };
exports.mkData = function (fish, props, state) { return ({
    type: 'data',
    fish: fish,
    props: props,
    state: state,
}); };
