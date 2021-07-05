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
/* tslint:disable:no-expression-statement no-if-statement */
import { httpConnector, registryEntry } from '../../src'
import { AppManifest, Pond } from '@actyx/pond'
import { MachineFish } from '../fish/machineFish'

const manifest: AppManifest = {
  appId: 'com.example.http-connector-example',
  displayName: 'Http Connector Example simple',
  version: '0.0.1',
}

// Api Server
Pond.default(manifest)
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
      },
    })
    console.log('http-connector is started')
  })
  .catch(err => console.error(err))
