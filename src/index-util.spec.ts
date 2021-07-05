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
import { bodyLimit, EmitResult, hasProperty, registryEntry, toEmitResult } from './index'
import { MachineFish } from '../example/fish/machineFish'

describe('API', () => {
  it('hasProperties', () => {
    expect(hasProperty({ 'name of Pro': 'hallo' }, 'name of Pro')).toBeTruthy()
    expect(hasProperty({ '1': 'hallo' }, '1')).toBeTruthy()
    expect(hasProperty({ name: 'hallo' }, 'name')).toBeTruthy()
    expect(hasProperty({ name: undefined }, 'name')).toBeTruthy()
    expect(hasProperty({ name: { t: 1 } }, 'name')).toBeTruthy()
    expect(hasProperty({ name: [1, 2] }, 'name')).toBeTruthy()

    expect(hasProperty([1, 2], 'length')).toBeTruthy()
    expect(hasProperty([1, 2], '1')).toBeTruthy()

    expect(hasProperty({ name: 'hallo' }, 'else')).toBeFalsy()
    expect(hasProperty({ Name: 'hallo' }, 'name')).toBeFalsy()
    expect(hasProperty({ some: { name: 'hallo' } }, 'name')).toBeFalsy()
    //@ts-expect-error
    expect(hasProperty('hallo', 'prop')).toBeFalsy()
    //@ts-expect-error
    expect(hasProperty(1, 'prop')).toBeFalsy()
  })
  it('registryEntry', () => {
    //@ts-expect-error
    registryEntry('fish', 'props')
    //@ts-expect-error
    registryEntry(MachineFish)

    expect(registryEntry(MachineFish.of)).toStrictEqual({ fish: MachineFish.of, props: undefined })
    expect(registryEntry(MachineFish.of, 'id')).toStrictEqual({ fish: MachineFish.of, props: 'id' })
    expect(JSON.stringify(registryEntry(MachineFish.of('id')))).toBe(
      JSON.stringify({
        fish: MachineFish.of('id'),
        props: undefined,
      }),
    )
    expect(JSON.stringify(registryEntry(MachineFish.of('id'), 'id'))).toBe(
      JSON.stringify({
        fish: MachineFish.of('id'),
        props: 'id',
      }),
    )
  })
  it('EmitResult.reply', () => {
    expect(EmitResult.reply(1)).toStrictEqual({ code: 1, payload: undefined })
    expect(EmitResult.reply(1, 'res')).toStrictEqual({ code: 1, payload: 'res' })
  })

  it('to EmitResult as Promise', async () => {
    expect(await toEmitResult(EmitResult.reply(1, 'a'))).toStrictEqual(EmitResult.reply(1, 'a'))
    expect(await toEmitResult(Promise.resolve(EmitResult.reply(1, 'a')))).toStrictEqual(
      EmitResult.reply(1, 'a'),
    )
  })

  it('bodyLimit == 20MB', () => {
    expect(bodyLimit).toBe('20mb')
  })
})
