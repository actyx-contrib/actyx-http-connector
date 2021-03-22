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
import { ApiServer, EmitResult, registryEntry } from '../src'
import { Pond } from '@actyx/pond'
import { MachineFish } from './fish/machineFish'

Pond.default()
  .then(pond => {
    ApiServer({
      pond,
      allowEmit: true,
      registry: {
        machineFish: registryEntry(MachineFish.of),
        machineRegistryFish: registryEntry(MachineFish.registry),
      },
      eventEmitters: {
        machineState: async (pond, payload) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
          //@ts-ignore
          await MachineFish.emitMachineState(pond, payload.machine, payload.state)
          return EmitResult.send(204)
        },
      },
    })
    console.log('connector started')
  })
  .catch(err => console.error(err))
