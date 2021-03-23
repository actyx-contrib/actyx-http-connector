"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mkData = exports.mkError = void 0;
/**
 * factory function to create an error message
 *
 * @param fish fish for the reply
 * @param props props used to create the fish
 * @param message Error message for the user
 * @returns Data that could send over the webSocket
 */
var mkError = function (fish, props, message) { return ({
    type: 'error',
    fish: fish,
    props: props,
    data: { message: message },
}); };
exports.mkError = mkError;
/**
 * factory function to create an data message containing the fish state
 *
 * @param fish fish for the reply
 * @param props props used to create the fish
 * @param data current state of the fish
 * @returns Data that could send over the webSocket
 */
var mkData = function (fish, props, data) { return ({
    type: 'data',
    fish: fish,
    props: props,
    data: data,
}); };
exports.mkData = mkData;
