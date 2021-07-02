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
import { Pond, TestPond } from '@actyx/pond'
import axios from 'axios'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const get = async (route: string): Promise<any> =>
  await axios.get(route).then(res => {
    if (res.status !== 200) {
      throw new Error('Fetch rejected')
    }
    return res.data
  })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const post = (route: string, data: unknown): Promise<any> =>
  axios
    .post(route, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(d => d.data)

type TestSetup = {
  pond: TestPond
  logSpy: jasmine.Spy
  preSetup: jest.Mock<unknown, unknown[]>
  postSetup: jest.Mock<unknown, unknown[]>
  infoSpy: jasmine.Spy
  emitSpy: jasmine.Spy
  observeSpy: jasmine.Spy
}

export const setupTest = (): TestSetup => {
  jest.resetAllMocks()
  const pond = Pond.test()
  const infoSpy = spyOn(pond, 'info')
  const emitSpy = spyOn(pond, 'emit').and.callThrough()
  /*((...param) => {
    console.debug(param, emitSpy.calls.count())

    return { toPromise: () => Promise.resolve() }
  })*/
  const observeSpy = spyOn(pond, 'observe').and.callThrough()
  const logSpy = spyOn(console, 'info')
  const preSetup = jest.fn()
  const postSetup = jest.fn()

  return { pond, logSpy, preSetup, postSetup, infoSpy, emitSpy, observeSpy }
}
