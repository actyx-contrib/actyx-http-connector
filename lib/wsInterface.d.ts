/**
 * WebSocket result, if the websocket could not be established
 */
declare type WsProtocolError = {
    /** indicator that this message is an error */
    type: 'error';
    /** fish that should be observed */
    fish: string;
    /** optional properties to observe the fish */
    props: string;
    /** data, containing the error message */
    data: {
        message: string;
    };
};
declare type WsProtocolData = {
    /** indicator that this message contains some data */
    type: 'data';
    /** fish that should be observed */
    fish: string;
    /** optional properties to observe the fish */
    props: string;
    /** data, containing the current state of the fish */
    data: unknown;
};
/** Data that the Websocket could return */
export declare type WsProtocol = WsProtocolError | WsProtocolData;
/**
 * factory function to create an error message
 *
 * @param fish fish for the reply
 * @param props props used to create the fish
 * @param message Error message for the user
 * @returns Data that could send over the webSocket
 */
export declare const mkError: (fish: string, props: string, message: string) => WsProtocolError;
/**
 * factory function to create an data message containing the fish state
 *
 * @param fish fish for the reply
 * @param props props used to create the fish
 * @param data current state of the fish
 * @returns Data that could send over the webSocket
 */
export declare const mkData: (fish: string, props: string, data: unknown) => WsProtocolData;
export {};
