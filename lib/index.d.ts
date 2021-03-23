/// <reference types="node" />
import { Fish, Pond } from '@actyx/pond';
import expressWs from 'express-ws';
/**
 * Helper to verify if a property exists in a given object
 * This function is type safe and in case that the property exists, the object type is enhanced.
 *
 * @param object object to check if a given property exists
 * @param property property that should exist in the given object
 * @returns returns true if the object has the property
 */
export declare const hasProperty: <T extends object | null, Key extends string>(object: T, property: string) => object is T & Record<Key, unknown>;
/**
 * Entry for the fish registry. All fish in this registry will be exposed via the http interface
 */
export declare type RegistryEntry<Event, Props> = {
    /** Fish or fish-factory to create the desired fish */
    fish: ((p: Props) => Fish<Event, any>) | Fish<Event, any>;
    /** In the case that the fish is a fish-factory, this will be the default parameter if no parameter is provided by the caller */
    props?: Props;
};
/**
 * helper function to create a RegistryEntry
 *
 * @param fish Fish or fish-factory to create the desired fish
 * @param props In the case that the fish is a fish-factory, this will be the default parameter if no parameter is provided by the caller
 * @returns A RegistryEntry for the http-connector::registry
 */
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
/** parameter Type for the fish state requests */
export declare type Params = {
    fish: string;
    props: string;
};
/** parameter Type for the emitter route */
export declare type Emit = {
    eventType: string;
};
/**
 * return type of the emitter function with the required information to create an reply to the client
 */
export declare type EmitResult = {
    /** http code (200, 204, or 401, 403, 500) */
    code: number;
    /** optional payload as reply to the client */
    payload?: string | Buffer;
};
/**
 * Helper to create the EmitResult
 */
export declare const EmitResult: {
    /**
     * Returns an EmitResult with the required information to create an reply to the client
     *
     * @param code http code (200, 204, or 401, 403, 500)
     * @param payload optional payload as reply to the client
     * @returns EmitResult for the emitter function
     */
    reply: (code: number, payload?: string | Buffer | undefined) => {
        code: number;
        payload: string | Buffer | undefined;
    };
};
/**
 * Configuration of the HttpConnector
 *
 * example:
 * ```
 * httpConnector({
 *   pond,
 *   allowEmit: false,
 *   registry: { someFish: registryEntry(SomeFish.of) },
 *   eventEmitters: {
 *     startSomeFish: async (pond, _payload) => {
 *       await SomeFish.emitStart(pond)
 *       return EmitResult.reply(204)
 *     },
 *   },
 *   preSetup: app => {
 *     app.use(xmlparser())
 *     // add Authentication
 *   },
 *   postSetup: app => {
 *     app.use((_req, res, _next) =>
 *       res.redirect('https://community.actyx.com')
 *     )
 *   },
 * })
 * ```
 */
export declare type HttpConnectorConfig = {
    /** pond instance to observe fish */
    pond: Pond;
    /**
     * Add the authentication layer before the routes are created.
     * This hook is added after urlencoded, json, and cors, you could add XML parser,
     * cookie parser and other middleware you like
     */
    preSetup?: (app: expressWs.Application) => void;
    /**
     * Add a handler after the routes are added to express,
     * This could be used for a default "not-Found" page or a redirect to your documentation
     */
    postSetup?: (app: expressWs.Application) => void;
    /**
     * Allows the user of the Http-Connector to emit events directly into actyx.
     *
     * **It is not recommended to use this feature.**
     *
     * Please use `eventEmitters` or at least add an authentication with `preSetup`
     */
    allowEmit?: boolean;
    /**
     * Propagate which fish you like to access from external programs.
     * The fish will be accessible over the http get request or can be observed with the websocket.
     *
     * The route will be: `/state/<key>/[property?]`
     *
     * You will find a list of all routes when you connect to the http-connector directly `e.g.: http://localhost:4242/`
     */
    registry?: {
        /** the key will be the path to access the fish */
        [fish: string]: RegistryEntry<any, any>;
    };
    /**
     * Add safer and easier event emitters to the http-connector.
     *
     * This methode is much safer than the `allowEmit: true`, you are in control which event
     * are emitted and you can verify the event with TypeScript or io-TS
     *
     * the emitter can be triggered with:
     * * POST: /emit/:eventType | Body: Payload
     * * e.g.: /emit/machineState | Body: {"machine": "M1", "state"; "idle"}
     *
     * ## example:
     * ```
     * type MachineStatePayload = {
     *   machine: string
     *   state: 'emergency' | 'disabled' | 'idle'
     * }
     *
     * const isMachineStatePayload = (payload: unknown): payload is MachineStatePayload =>
     *   typeof payload === 'object' &&
     *   hasProperty(payload, 'machine') &&
     *   typeof payload.machine == 'string' &&
     *   hasProperty(payload, 'state') &&
     *   typeof payload.state == 'string' &&
     *   ['emergency', 'disabled', 'idle'].includes(payload.state)
     *
     * httpConnector({
     *   //[...]
     *   eventEmitters: {
     *     machineState: async (pond, payload) => {
     *       if (isMachineStatePayload(payload)) {
     *         await MachineFish.emitMachineState(pond, payload.machine, payload.state)
     *         return EmitResult.reply(204)
     *       } else {
     *         return EmitResult.reply(403, 'wrong parameter')
     *       }
     *     },
     *   }
     * })
     * ```
     */
    eventEmitters?: {
        [fish: string]: (pond: Pond, payload: unknown) => EmitResult | Promise<EmitResult>;
    };
    /**
     * settings to overwrite the default configuration
     *
     * default: 0.0.0.0:4242
     */
    endpoint?: {
        /**
         * hostname to configure the tcp socket.
         *
         * * localhost: for local only
         * * \<IP\>: for a specific interface only
         * * 0.0.0.0: for any source
         */
        host: string;
        /** listen port for the http server */
        port: number;
    };
};
/**
 * Initialize the http-Connector. This could be part of an existing application
 * or be the main purpose of an new actyx app
 *
 * ## example:
 * ```
 * httpConnector({
 *   pond,
 *   allowEmit: false,
 *   registry: { someFish: registryEntry(SomeFish.of) },
 *   eventEmitters: {
 *     startSomeFish: async (pond, _payload) => {
 *       await SomeFish.emitStart(pond)
 *       return EmitResult.reply(204)
 *     },
 *   },
 *   preSetup: app => {
 *     app.use(xmlparser())
 *     // add Authentication
 *   },
 *   postSetup: app => {
 *     app.use((_req, res, _next) =>
 *       res.redirect('https://community.actyx.com')
 *     )
 *   },
 * })
 * ```
 *
 * @param config HttpConnectorConfig to configure the Server
 * @returns Express-ws instance for further use
 */
export declare const httpConnector: (config: HttpConnectorConfig) => expressWs.Application;
