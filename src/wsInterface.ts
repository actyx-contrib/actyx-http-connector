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
/**
 * WebSocket result, if the websocket could not be established
 */
type WsProtocolError = {
  /** indicator that this message is an error */
  type: 'error'
  /** fish that should be observed */
  fish: string
  /** optional properties to observe the fish */
  props: string
  /** data, containing the error message */
  data: { message: string }
}

type WsProtocolData = {
  /** indicator that this message contains some data */
  type: 'data'
  /** fish that should be observed */
  fish: string
  /** optional properties to observe the fish */
  props: string
  /** data, containing the current state of the fish */
  data: unknown
}

/** Data that the Websocket could return */
export type WsProtocol = WsProtocolError | WsProtocolData

/**
 * factory function to create an error message
 *
 * @param fish fish for the reply
 * @param props props used to create the fish
 * @param message Error message for the user
 * @returns Data that could send over the webSocket
 */
export const mkError = (fish: string, props: string, message: string): WsProtocolError => ({
  type: 'error',
  fish,
  props,
  data: { message },
})

/**
 * factory function to create an data message containing the fish state
 *
 * @param fish fish for the reply
 * @param props props used to create the fish
 * @param data current state of the fish
 * @returns Data that could send over the webSocket
 */
export const mkData = (fish: string, props: string, data: unknown): WsProtocolData => ({
  type: 'data',
  fish,
  props,
  data,
})
