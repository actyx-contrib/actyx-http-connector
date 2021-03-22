declare type WsProtocolError = {
    type: 'error';
    fish: string;
    props: string;
    data: {
        message: string;
    };
};
declare type WsProtocolData = {
    type: 'data';
    fish: string;
    props: string;
    state: unknown;
};
export declare type WsProtocol = WsProtocolError | WsProtocolData;
export declare const mkError: (fish: string, props: string, message: string) => WsProtocolError;
export declare const mkData: (fish: string, props: string, state: unknown) => WsProtocolData;
export {};
