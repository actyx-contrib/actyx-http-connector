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
/* tslint:disable:no-expression-statement no-if-statement */
import { httpConnector, EmitResult, hasProperty, registryEntry } from '../src'
import { Pond } from '@actyx/pond'
import { MachineFish } from './fish/machineFish'

// Event validator
type MachineStatePayload = {
  machine: string
  state: 'emergency' | 'disabled' | 'idle'
}

const isMachineStatePayload = (payload: unknown): payload is MachineStatePayload =>
  typeof payload === 'object' &&
  hasProperty(payload, 'machine') &&
  typeof payload.machine == 'string' &&
  hasProperty(payload, 'state') &&
  typeof payload.state == 'string' &&
  ['emergency', 'disabled', 'idle'].includes(payload.state)

// Api Server
Pond.default()
  .then(pond => {
    httpConnector({
      // the pond instance is required for the http-connector
      pond,
      // Allows the user of the Http-Connector to emit events directly into actyx.
      // It is not recommended to use this feature.
      // Please use `eventEmitters` or at least add an authentication with `preSetup`
      allowEmit: true,
      // propagate which fish you like to access from external programs.
      // the fish will be published over the http get request or can be observed with the websocket
      registry: {
        machineFish: registryEntry(MachineFish.of),
        machineRegistryFish: registryEntry(MachineFish.registry),
      },
      // add safer and easier event emitters.
      // This methode is much safer than the `allowEmit: true`, you are in control which event
      // are emitted and you can verify the event with TypeScript or io-TS
      eventEmitters: {
        machineState: async (pond, payload) => {
          if (isMachineStatePayload(payload)) {
            await MachineFish.emitMachineState(pond, payload.machine, payload.state)
            return EmitResult.reply(204)
          } else {
            return EmitResult.reply(403, 'wrong parameter')
          }
        },
      },
      // Add the authentication layer before the routes are created.
      // this hook is added after urlencoded, json, and cors, you could add XML parser,
      // cookie parser and other middleware you like
      preSetup: app => {
        app.use((req, res, next) => {
          // example for a very trivial cookie authentication. This will work with Websockets
          // as well, but requires a cookie
          const auth = req.headers?.cookie?.split('; ').find(c => c.startsWith('authorization='))
          if (auth && auth.endsWith('Basic dXNlcm5hbWU6cGFzc3dvcmQ=')) {
            next()
          } else {
            res.sendStatus(401)
          }
        })
      },
      // Add a handler after the routes are added to express,
      // this could be used for a default "not-Found" page or a redirect to your documentation
      postSetup: app => {
        app.use((_req, res, _next) => {
          res.redirect('https://community.actyx.com')
        })
      },
    })
    console.log('http-connector is started')
  })
  .catch(err => console.error(err))
