<img width="130px" src="https://raw.githubusercontent.com/actyx-contrib/actyx-HTTP-Connector/master/icon.png?token=AATHWQIC5RWS62GY3OINH3C645MHQ">

# Actyx-HTTP-Connector

Need connector to talk an Actyx swarm from external applcations via HTTP?

`Actyx-HTTP-Connector` allows you to build one in a few of minutes while keeping the embedded HTTP server fully customizeable.

## ✨ Features

- Get your local source Id
- Get the pond state
- Check if your node is in sync with the swarm
- Current swarm connectivity
- Publish event directly to Actyx (dangerous)
- Register your fish and get the state
- WebSocket connection to observe the fish in your registry
- Emitter function with more control for easy-to-use emit routes
- preSetup express hook to add middleware as body-parser, static files or authentication layers
- postSetup express hook to add fall through a handler or add custom routes

## 📦 Installation

Actyx-HTTP-Connector is available as a [npm package](https://www.npmjs.com/package/@actyx-contrib/actyx-http-connector).

```shell
npm install @actyx-contrib/actyx-http-connector
```

# 📖 Documentation

The complete API documentation and related examples are available at [https://actyx-contrib.github.io/actyx-HTTP-Connector](https://actyx-contrib.github.io/actyx-http-connector/)

# Detailed Examples

You can find sample applications [on GitHub](https://github.com/actyx-contrib/actyx-http-connector/tree/master/example).

The `simple` example exposes the possibility to query fish state and emit events to the Pond directly. The `advanced` example adds web socket communication, uses event emitters and adds authentication. Both projcets come with a simple react app. Note that these apps do _not_ directly talk to the Actyx node but the HTTP connector.

Run the examples using `npm i && npm run example:simple` or `npm i && npm run example:advanced`, respectivly.

After building the projects, you can access a the UI that uses the HTTP-Connector at http://localhost:1234. Please verify the port with the console output during the build.

# 🤓 Quick start

## 🌊 `httpConnector`

TODO: Describe Actyx Prerequisites

Use `httpConnector()` to create an HTTP-Connector instace. 

# 🤓 Examples

## Minimal example

```typescript
import { httpConnector, registryEntry } from '../../src'
import { Pond } from '@actyx/pond'
// Api Server
Pond.default().then(pond => {
  httpConnector({
    // The pond instance is required for the HTTP-Connector
    pond,
    // Allows the user of the HTTP-Connector to emit events directly into actyx.
    // It is not recommended to use this feature.
    // Please use `eventEmitters` or at least add an authentication with `preSetup`
    allowEmit: true,
    // Propagate which fish you like to access from external programs.
    // The fish will be published over the HTTP get request or can be observed with the websocket
    registry: { someFish: registryEntry(SomeFish.of) },
  })
})
```

## Complete example

```typescript
import { httpConnector, registryEntry } from '../../src'
import { Pond } from '@actyx/pond'
// Api Server
Pond.default().then(pond => {
  httpConnector({
    // The pond instance is required for the HTTP-Connector
    pond,
    // Propagate which fish you like to access from external programs.
    // The fish will be published over the HTTP get request or can be observed with the websocket
    registry: {
      someFish: registryEntry(SomeFish.of),
    },
    // Add event emitters.
    // This methode is much safer than the `allowEmit: true`, you are in control which event
    // are emitted and you can verify the event with TypeScript or io-TS
    eventEmitters: {
      startSomeFish: async (pond, _payload) => {
        await SomeFish.emitStart(pond)
        return EmitResult.reply(204)
      },
    },
    // Add the authentication layer before the routes are created.
    // this hook is added after urlencoded, json, you could add XML parser,
    // cookie parser and other middleware you like
    preSetup: app => {
      app.use(xmlparser())
      // add Authentication
    },
    // Add a handler after the routes are added to express.
    // This could be used for a default "not-Found" page or a redirect to your documentation
    postSetup: app => {
      app.use((_req, res, _next) =>
        res.redirect('https://community.actyx.com')
      )
    },
  })
})
```
