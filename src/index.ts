/*
 * Copyright 2021 Actyx AG
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* tslint:disable:no-expression-statement strict-type-predicates no-if-statement no-namespace */
import { Fish, Pond, SplashState, Tags } from '@actyx/pond'
import { json, urlencoded } from 'body-parser'
import cors from 'cors'
import express from 'express'
import expressWs from 'express-ws'
import { mkError, mkData } from './wsInterface'

/**
 * Helper to verify if a property exists in a given object
 * This function is type safe and in case that the property exists, the object type is enhanced.
 *
 * @param object object to check if a given property exists
 * @param property property that should exist in the given object
 * @returns returns true if the object has the property
 */
export const hasProperty = <T extends object | null, Key extends string>(
  object: T,
  property: string,
): object is T & Record<Key, unknown> => object && object.hasOwnProperty(property)

/**
 * Entry for the fish registry. All fish in this registry will be exposed via the http interface
 */
export type RegistryEntry<Event, Props> = {
  /** Fish or fish-factory to create the desired fish */
  fish: ((p: Props) => Fish<Event, any>) | Fish<Event, any>
  /** In the case that the fish is a fish-factory, this will be the default parameter if no parameter is provided by the caller */
  props?: Props
}
/**
 * helper function to create a RegistryEntry
 *
 * @param fish Fish or fish-factory to create the desired fish
 * @param props In the case that the fish is a fish-factory, this will be the default parameter if no parameter is provided by the caller
 * @returns A RegistryEntry for the http-connector::registry
 */
export const registryEntry = <Event, Props>(
  fish: ((p: Props) => Fish<Event, any>) | Fish<Event, any>,
  props?: Props,
): RegistryEntry<Event, Props> => ({
  fish,
  props,
})

/** parameter Type for the fish state requests */
export type Params = { fish: string; props: string }
/** parameter Type for the emitter route */
export type Emit = { eventType: string }
/** request context for local to stage the get request with proper error handling */
type RequestCtx = {
  fish: ((p: any) => Fish<any, any>) | Fish<any, any>
  props: string
}

/**
 * return type of the emitter function with the required information to create an reply to the client
 */
export type EmitResult = {
  /** http code (200, 204, or 401, 403, 500) */
  code: number
  /** optional payload as reply to the client */
  payload?: string | Buffer
}

/**
 * Helper to create the EmitResult
 */
export const EmitResult = {
  /**
   * Returns an EmitResult with the required information to create an reply to the client
   *
   * @param code http code (200, 204, or 401, 403, 500)
   * @param payload optional payload as reply to the client
   * @returns EmitResult for the emitter function
   */
  reply: (code: number, payload?: string | Buffer) => ({
    code,
    payload,
  }),
}

/**
 * internal function to handle the emitter as async and sync function
 *
 * @param result EmitResult | Promise<EmitResult> from the emitter
 * @returns unified Promise<EmitResult>
 */
export const toEmitResult = async (
  result: EmitResult | Promise<EmitResult>,
): Promise<EmitResult> => {
  if (hasProperty(result, 'code')) {
    return await Promise.resolve(result)
  } else {
    return result
  }
}

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
export type HttpConnectorConfig = {
  /** pond instance to observe fish */
  pond: Pond
  /**
   * Add the authentication layer before the routes are created.
   * This hook is added after urlencoded, json, and cors, you could add XML parser,
   * cookie parser and other middleware you like
   */
  preSetup?: (app: expressWs.Application) => void
  /**
   * Add a handler after the routes are added to express,
   * This could be used for a default "not-Found" page or a redirect to your documentation
   */
  postSetup?: (app: expressWs.Application) => void
  /**
   * Allows the user of the Http-Connector to emit events directly into actyx.
   *
   * **It is not recommended to use this feature.**
   *
   * Please use `eventEmitters` or at least add an authentication with `preSetup`
   */
  allowEmit?: boolean
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
    [fish: string]: RegistryEntry<any, any>
  }
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
    [fish: string]: (pond: Pond, payload: unknown) => EmitResult | Promise<EmitResult>
  }
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
    host: string
    /** listen port for the http server */
    port: number
  }
}

/**
 * @ignore
 */
export const bodyLimit = '20mb'

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
export const httpConnector = (config: HttpConnectorConfig): expressWs.Application => {
  console.info('creating http-connector')
  const { pond, preSetup, postSetup, allowEmit, registry, eventEmitters } = config

  const registryRoutes = (path: string) =>
    Object.entries(registry || {})
      .map(([key, value]) => {
        const fishId =
          typeof value.fish === 'function' ? value.fish('{param}').fishId : value.fish.fishId
        const route =
          typeof value.fish === 'function' ? `/${path}/${key}/{param}` : `/${path}/${key}`

        return [route, `FishId: ${fishId.entityType} ${fishId.name}`]
      })
      .reduce((acc, [route, value]) => ({ ...acc, [route]: value }), {})

  const emitRoutes = Object.keys(eventEmitters || {}).map(name => `/emit/${name}`)

  const directEmitRoute = allowEmit
    ? 'Route to emit an event directly. Post call with JSON body: { tags: string[], payload: any }'
    : 'Direct emit not enabled (allowEmit != true)'

  const index = () => ({
    '/system/info': 'system information',
    '/system/pondState': 'fish jar state',
    '/system/sync': 'swarm sync state',
    '/emit': directEmitRoute,
    states: {
      ...registryRoutes('state'),
    },
    emitter: { info: 'POST call. Send event payload as JSON', routes: emitRoutes },
    webSocket: {
      ...registryRoutes('observe-state'),
    },
  })

  let swarmSyncState: SplashState | undefined = undefined
  let syncDone = false
  pond.waitForSwarmSync({
    enabled: true,
    onProgress: s => (swarmSyncState = s),
    onSyncComplete: () => (syncDone = true),
  })

  const app = expressWs(express()).app
  app.use(urlencoded({ extended: false, limit: bodyLimit }))
  app.use(json({ limit: bodyLimit }))
  app.use(cors())

  preSetup && preSetup(app)

  // add System Routes
  app.get('/', (_req, res) => res.send(index()))
  app.get('/system/info', (_req, res) => {
    res.status(200).send(pond.info())
  })
  app.get('/system/pondState', (_req, res) => {
    pond.getPondState(state => {
      res.status(200).send(state)
    })
  })
  app.get('/system/sync', (_req, res) => {
    res.status(200).send({
      swarmSyncState,
      syncDone,
    })
  })

  // add user routes
  if (allowEmit) {
    app.post('/emit', async (req, res) => {
      let data = req.body
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data)
        } catch (_) {
          res.status(403)
          res.send({ message: `invalid payload` })
        }
      }
      const { tags, payload } = data

      if (!Array.isArray(tags) || tags.length === 0) {
        res.status(403)
        res.send({ message: `tags are invalid ${tags}` })
        return
      }
      if (payload === undefined) {
        res.status(403)
        res.send({ message: `payload is missing` })
        return
      }
      const axTag = Tags(...tags)

      try {
        await pond.emit(axTag, payload).toPromise()
        res.sendStatus(204)
      } catch (e) {
        res.status(500)
        res.send(e)
      }
    })
  }
  if (registry) {
    // there are no type definitions for express-ws
    app.use<Params>('/state/:fish/:props?', (req, res, next) => {
      const { fish: requestedFish, props } = req.params
      const entry = registry[requestedFish]

      if (entry === undefined) {
        res.status(404)
        res.send({ message: `No fish registered for ${requestedFish}` })
        return
      }

      const { fish } = entry
      if (typeof fish === 'function' && entry.props !== undefined && props !== undefined) {
        console.info(`Ignoring parameter name=${entry.props} for fish ${fish}, using ${props}`)
      }

      const finalProps =
        props !== undefined ? props : typeof fish === 'function' ? entry.props : fish.fishId.name
      if (finalProps === undefined) {
        res.status(404)
        res.send({
          message: `Missing properties for fish: ${
            typeof fish === 'function' ? fish('props').fishId.entityType : fish.fishId.entityType
          }`,
        })
        return
      }

      const fishCtx: RequestCtx = { fish, props: finalProps }
      // tslint:disable-next-line no-object-mutation
      res.locals = fishCtx

      next()
    })

    app.get<Params>('/state/:fish/:props?', (req, res) => {
      const { fish: requestedFish, props: requestedProps } = req.params
      const { fish, props } = res.locals
      console.info(`http get connected: ${requestedFish}, ${requestedProps}`)
      const fishToObserve = typeof fish === 'function' ? fish(props) : fish

      const unSub = pond.observe(fishToObserve, state =>
        setImmediate(() => {
          unSub()
          res.status(200)
          res.send(state)
        }),
      )
    })

    app.ws('/observe-state/:fish/:props?', (ws, req) => {
      const { fish: requestedFish, props } = req.params
      console.info(`Ws connected: ${requestedFish}, ${props}`)
      const entry = registry[requestedFish]

      if (entry === undefined) {
        const message = `No fish registered for ${requestedFish}`
        ws.send(mkError(requestedFish, props, message))
        ws.close()
        return
      }

      const { fish } = entry
      if (typeof fish === 'function' && entry.props !== undefined && props !== undefined) {
        console.info(`Ignoring parameter name=${entry.props} for fish ${fish}, using ${props}`)
      }

      const finalProps =
        props !== undefined ? props : typeof fish === 'function' ? entry.props : fish.fishId.name
      if (finalProps === undefined) {
        const message = `Missing properties for fish: ${
          typeof fish === 'function' ? fish('props').fishId.entityType : fish.fishId.entityType
        }`
        ws.send(mkError(requestedFish, props, message))
        ws.close()
        return
      }

      const fishToObserve = typeof fish === 'function' ? fish(finalProps) : fish

      const unSub = pond.observe(fishToObserve, state => {
        ws.send(JSON.stringify(mkData(requestedFish, props, state)), console.log)
      })

      ws.on('close', _ => unSub())
      ws.on('error', _ => unSub())
    })
  }
  if (eventEmitters) {
    app.post<Emit>('/emit/:eventType', async (req, res) => {
      try {
        const { eventType } = req.params
        const result = await toEmitResult(eventEmitters[eventType](pond, req.body))

        if (result.payload) {
          res.status(result.code).send(result.payload)
        }
      } catch (error) {
        console.error(
          `catch: internal error. '${JSON.stringify(req.body, undefined, 2)}': '${error}'`,
          req.body,
        )
        res.status(500).jsonp({ message: `${error}` })
      }
    })
  }

  postSetup && postSetup(app)

  // listen to endpoint configured in the settings
  if (config.endpoint) {
    const { host, port } = config.endpoint
    console.info('listening on %s:%s', host, port)
    app.listen(port, host)
  } else {
    console.info('listening on 4242')
    app.listen(4242)
  }
  return app
}
