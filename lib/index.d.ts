/// <reference types="node" />
import { Fish, Pond } from '@actyx/pond';
import express from 'express';
export declare const stringify: (data: unknown) => string;
export declare type Params = {
    fish: string;
    props: string;
};
export declare type Emit = {
    eventType: string;
};
export declare type RegistryEntry<Event, Props> = {
    fish: ((p: Props) => Fish<Event, any>) | Fish<Event, any>;
    props?: Props;
};
export declare const registryEntry: <Event_1, Props>(fish: Readonly<{
    where: import("@actyx/pond").Where<any>;
    initialState: Event_1;
    onEvent: import("@actyx/pond").Reduce<Event_1, any>;
    fishId: import("@actyx/pond").FishId;
    isReset?: import("@actyx/pond").IsReset<any> | undefined;
    deserializeState?: ((jsonState: unknown) => Event_1) | undefined;
}> | ((p: Props) => Readonly<{
    where: import("@actyx/pond").Where<any>;
    initialState: Event_1;
    onEvent: import("@actyx/pond").Reduce<Event_1, any>;
    fishId: import("@actyx/pond").FishId;
    isReset?: import("@actyx/pond").IsReset<any> | undefined;
    deserializeState?: ((jsonState: unknown) => Event_1) | undefined;
}>), props?: Props | undefined) => RegistryEntry<Event_1, Props>;
export declare type ParseError = {
    message: string;
    detail: any;
};
export declare type EmitResult = {
    code: number;
    payload?: string | Buffer;
};
export declare const EmitResult: {
    send: (code: number, payload?: string | Buffer | undefined) => {
        code: number;
        payload: string | Buffer | undefined;
    };
};
export declare type ApiServerConfig = {
    pond: Pond;
    allowEmit?: boolean;
    registry?: {
        [fish: string]: RegistryEntry<any, any>;
    };
    eventEmitters?: {
        [fish: string]: (pond: Pond, payload: unknown) => EmitResult | Promise<EmitResult>;
    };
    endpoint?: {
        host: string;
        port: number;
    };
};
export declare const ApiServer: (config: ApiServerConfig) => express.Application;
