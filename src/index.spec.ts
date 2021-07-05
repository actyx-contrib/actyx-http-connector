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
import { httpConnector, HttpConnectorConfig, registryEntry } from './index'
import { MachineFish } from '../example/fish/machineFish'
import { get, post, setupTest } from './utils.test'

describe('API', () => {
  it('setup', async () => {
    const { pond, logSpy, preSetup, postSetup } = setupTest()
    const port = 18080

    httpConnector({
      pond,
      preSetup,
      postSetup,
      allowEmit: false,
      endpoint: {
        host: 'localhost',
        port,
      },
    })

    // check if startup works
    expect(logSpy).toHaveBeenCalledWith('creating http-connector')
    expect(logSpy).toHaveBeenCalledWith('listening on %s:%s', 'localhost', port)
    expect(preSetup).toHaveBeenCalled()
    expect(postSetup).toHaveBeenCalled()
  })

  it('routes', async () => {
    const { pond, logSpy, preSetup, postSetup } = setupTest()
    const port = 18081

    httpConnector({
      pond,
      preSetup,
      postSetup,
      allowEmit: true,
      registry: {
        machineFish: registryEntry(MachineFish.of),
      },
      eventEmitters: {},
      endpoint: {
        host: 'localhost',
        port,
      },
    })

    // check if startup works
    expect(logSpy).toHaveBeenCalledWith('creating http-connector')
    expect(logSpy).toHaveBeenCalledWith('listening on %s:%s', 'localhost', port)
    expect(preSetup).toHaveBeenCalled()
    expect(postSetup).toHaveBeenCalled()

    // check if index / menu get shown up
    const menu = await get(`http://localhost:${port}`)
    expect(menu['/emit']).not.toContain('allowEmit != true')
    expect(menu['/system/info']).toBeDefined()
    expect(menu['/system/pondState']).toBeDefined()
    expect(menu['/system/sync']).toBeDefined()

    expect(menu.emitter).toBeDefined()
    expect(menu.emitter.routes).toStrictEqual([])
    expect(menu.states).toBeDefined()
    expect(menu.states['/state/machineFish/{param}']).toBeDefined()
    expect(menu.webSocket).toBeDefined()
    expect(menu.webSocket['/observe-state/machineFish/{param}']).toBeDefined()
  })

  it('direct emit', async () => {
    const { pond, emitSpy } = setupTest()
    const port = 18082

    const config: HttpConnectorConfig = {
      pond,
      allowEmit: true,
      endpoint: {
        host: 'localhost',
        port,
      },
    }

    httpConnector(config)

    // check if index / menu get shown up
    const menu = await get(`http://localhost:${port}`)
    expect(menu['/emit']).not.toContain('allowEmit != true')

    await post(`http://localhost:${port}/emit`, {
      tags: ['abc'],
      payload: { eventType: 'a' },
    })
    expect(emitSpy).toHaveBeenCalled()
  })

  it('no direct emit', async () => {
    const { pond, emitSpy } = setupTest()
    const port = 18083

    httpConnector({
      pond,
      allowEmit: false,
      registry: {
        machineFish: registryEntry(MachineFish.of),
      },
      eventEmitters: {},
      endpoint: {
        host: 'localhost',
        port,
      },
    })

    // check if index / menu get shown up
    const menu = await get(`http://localhost:${port}`)
    expect(menu['/emit']).toBeDefined()
    expect(menu['/emit']).toContain('allowEmit != true')

    await expect(
      post(`http://localhost:${port}/emit`, {
        tags: ['abc'],
        payload: { eventType: 'a' },
      }),
    ).rejects.toThrow('Request failed with status code 404')
    expect(emitSpy).not.toHaveBeenCalled()
  })
})
