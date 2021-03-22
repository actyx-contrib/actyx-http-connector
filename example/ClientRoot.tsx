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
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { SetStateEvent } from './fish/machineFish'

export const App = () => {
  const [machineState, setMachineState] = React.useState('')
  const [wsMachineState, setWsMachineState] = React.useState('')
  const [machineName, setMachineName] = React.useState('Machine 1')
  const [emitResult, setEmitResult] = React.useState('')

  const getMachineFishState = () => {
    fetch(`http://localhost:4242/state/machineFish/${machineName}`, { headers: { key: 'someKey' } })
      .then(res => res.body.getReader().read())
      .then(data => Buffer.from(data.value).toString())
      .then(JSON.parse)
      .then(setMachineState)
  }
  const emitState = (state: SetStateEvent['state']) => () => {
    // like: MachineFish.emitMachineState
    const data = {
      tags: ['machine', `machine:${machineName}`, 'machine-state', `machine-state:${machineName}`],
      payload: {
        eventType: 'setState',
        machine: machineName,
        state: state,
      } as SetStateEvent,
    }

    fetch(`http://localhost:4242/emit`, {
      body: JSON.stringify(data),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        key: 'someKey',
      },
    })
      .then(() => setEmitResult('send'))
      .catch(() => setEmitResult('failed'))
  }
  const emitterState = (state: SetStateEvent['state']) => () => {
    // like: MachineFish.emitMachineState
    fetch(`http://localhost:4242/emit/machineState`, {
      body: JSON.stringify({
        machine: machineName,
        state: state,
      }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        key: 'someKey',
      },
    })
      .then(() => setEmitResult('send'))
      .catch(() => setEmitResult('failed'))
  }

  React.useEffect(() => {
    document.cookie = `authorization=Basic ${btoa('username:password')}`

    const ws = new WebSocket(`ws://localhost:4242/observe-state/machineFish/${machineName}`)
    ws.onmessage = message => {
      setWsMachineState(JSON.parse(message.data))
    }
    return () => ws.close()
  }, [machineName])

  const cardStyle: React.CSSProperties = {
    borderRadius: 3,
    width: 600,
    margin: '12px 12px',
    padding: '12px 24px',
    backgroundColor: 'white',
  }

  return (
    <div>
      <div style={cardStyle}>
        <div>Select Machine</div>
        <div>
          <input onChange={({ target }) => setMachineName(target.value)} value={machineName} />
        </div>
      </div>

      <div style={cardStyle}>
        <div>HTTP-Request: Machine State</div>
        <div>
          <button onClick={getMachineFishState}>get MachineFish state</button>
        </div>
        <div>
          <pre>{JSON.stringify(machineState, undefined, 2)}</pre>
        </div>
      </div>

      <div style={cardStyle}>
        <div>HTTP-emit: Machine status</div>
        <div>
          <button onClick={emitState('idle')}>Idle</button>
          <button onClick={emitState('disabled')}>Off</button>
          <button onClick={emitState('emergency')}>Emergency</button>
        </div>
        <div>
          <pre>{emitResult}</pre>
        </div>
      </div>

      <div style={cardStyle}>
        <div>HTTP-emitter</div>
        <div>
          <button onClick={emitterState('idle')}>Idle</button>
        </div>
        <div>
          <pre>{emitResult}</pre>
        </div>
      </div>

      <div style={cardStyle}>
        <div>WebSocket-observe: Machine status</div>
        <div>
          <pre>{JSON.stringify(wsMachineState, undefined, 2)}</pre>
        </div>
      </div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
