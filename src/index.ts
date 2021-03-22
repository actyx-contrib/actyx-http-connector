/*
 * Copyright 2020 Actyx AG
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
import { Fish, Pond, SplashState, ConnectivityStatus, Tags } from '@actyx/pond'
import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import expressWs from 'express-ws'
import { mkError, mkData } from './wsInterface'

export const stringify = (data: unknown): string => JSON.stringify(data, undefined, 2)

export type Params = { fish: string; props: string }
export type Emit = { eventType: string }

export type RegistryEntry<Event, Props> = {
  fish: ((p: Props) => Fish<Event, any>) | Fish<Event, any>
  props?: Props
}
export const registryEntry = <Event, Props>(
  fish: ((p: Props) => Fish<Event, any>) | Fish<Event, any>,
  props?: Props,
): RegistryEntry<Event, Props> => ({
  fish,
  props,
})

type RequestCtx = {
  fish: ((p: any) => Fish<any, any>) | Fish<any, any>
  props: string
}

export type ParseError = {
  message: string
  detail: any
}

export type EmitResult = {
  code: number
  payload?: string | Buffer
}

export const EmitResult = {
  send: (code: number, payload?: string | Buffer) => ({
    code,
    payload,
  }),
}

const toEmitResult = async (result: EmitResult | Promise<EmitResult>): Promise<EmitResult> => {
  if (result.hasOwnProperty('then')) {
    const promiseResult = result as Promise<EmitResult>
    return promiseResult
  } else {
    return await Promise.resolve(result as EmitResult)
  }
}

export type ApiServerConfig = {
  pond: Pond
  allowEmit?: boolean
  registry?: {
    [fish: string]: RegistryEntry<any, any>
  }
  eventEmitters?: {
    [fish: string]: (pond: Pond, payload: unknown) => EmitResult | Promise<EmitResult>
  }
  endpoint?: {
    host: string
    port: number
  }
}

const bodyLimit = '20mb'

export const ApiServer = (config: ApiServerConfig): express.Application => {
  console.info('creating ApiServer')
  const { pond, allowEmit, registry, eventEmitters } = config

  const registryRouts = Object.entries(registry || {})
    .map(([key, value]) => {
      console.log(key, typeof value.fish)

      const fishId =
        typeof value.fish === 'function' ? value.fish('{param}').fishId : value.fish.fishId
      const route = typeof value.fish === 'function' ? `/state/${key}/{param}` : `/state/${key}`

      return [route, `FishId: ${fishId.entityType} ${fishId.name}`]
    })
    .reduce((acc, [route, value]) => ({ ...acc, [route]: value }), {})

  const emitRouts = Object.keys(eventEmitters || {}).map(name => `/emit/${name}`)

  const directEmitRoute = allowEmit
    ? 'Route to emit an event directly. Post call with JSON body: { tags: string[], payload: any }'
    : 'Direct emit not enabled (allowEmit != true)'

  const index = () => ({
    '/system/info': 'system information',
    '/system/pondState': 'fish jar state',
    '/system/sync': 'swarm sync state',
    '/system/connectivity': 'current swarm connectivity',
    '/emit': directEmitRoute,
    states: {
      ...registryRouts,
    },
    emitter: { info: 'POST call. Send event payload as JSON', routs: emitRouts },
  })

  let swarmSyncState: SplashState | undefined = undefined
  let syncDone = false
  let nodeConnectivityState: ConnectivityStatus | undefined = undefined
  pond.waitForSwarmSync({
    enabled: true,
    onProgress: s => (swarmSyncState = s),
    onSyncComplete: () => (syncDone = true),
  })
  pond.getNodeConnectivity({ callback: state => (nodeConnectivityState = state) })

  const app = expressWs(express()).app
  app.use(bodyParser.urlencoded({ extended: false, limit: bodyLimit }))
  app.use(bodyParser.json({ limit: bodyLimit }))
  app.use(cors())
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
  app.get('/system/connectivity', (_req, res) => {
    res.status(200).send(nodeConnectivityState)
  })

  if (allowEmit) {
    app.post('/emit', async (req, res) => {
      const { tags, payload } = req.body
      console.log(tags, payload)

      if (!Array.isArray(tags) || tags.length === 0) {
        res.status(403)
        res.send({ message: `tags are invalid ${tags}` })
        return
      }
      //echo '{"tags": ["a", "b", "c"], "payload": "a"}' | curl -X "POST" -d @- -H "Content-Type: application/json"  localhost:4242/emit
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

    app.get('/state/:fish/:props?', (req, res) => {
      const { fish: requestedFish, props: requestedProps } = req.params
      const { fish, props } = res.locals
      console.log(`http get connected: ${requestedFish}, ${requestedProps}`)
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
      console.log(`Ws connected: ${requestedFish}, ${props}`)
      const entry = registry[requestedFish]

      if (entry === undefined) {
        console.log(entry)

        const message = `No fish registered for ${requestedFish}`
        ws.send(mkError(requestedFish, props, message))
        ws.close()
        return
      }

      const { fish } = entry
      if (typeof fish === 'function' && entry.props !== undefined && props !== undefined) {
        console.log('Ignoring parameter')
        console.info(`Ignoring parameter name=${entry.props} for fish ${fish}, using ${props}`)
      }

      const finalProps =
        props !== undefined ? props : typeof fish === 'function' ? entry.props : fish.fishId.name
      if (finalProps === undefined) {
        console.log('Missing properties')
        const message = `Missing properties for fish: ${
          typeof fish === 'function' ? fish('props').fishId.entityType : fish.fishId.entityType
        }`
        ws.send(mkError(requestedFish, props, message))
        ws.close()
        return
      }

      const fishToObserve = typeof fish === 'function' ? fish(finalProps) : fish

      console.log('observe')

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
        console.error(`catch: internal error. '${stringify(req.body)}': '${error}'`, req.body)
        res.status(500).jsonp({ message: `${error}` })
      }
    })
  }

  // this can only be tested by actually opening a server socket!
  /* istanbul ignore next */
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
