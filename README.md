<img width="130px" src="https://raw.githubusercontent.com/actyx-contrib/actyx-http-connector/master/icon.png?token=AATHWQIC5RWS62GY3OINH3C645MHQ">

# Actyx-Http-Connector

Build your Actyx-Http-Connector in a couple of minutes, but keep the full control over the http server.

## ✨ Features

- Get your local source Id
- Get the pond state
- Check if your node is in sync with the swarm
- Current swarm connectivity
- Publish event directly to Actyx (dangerous)
- Register your fish and get the state
- WebSocket connection to observe the fish in your registry
- Emitter function with more control for easy to use emit routes
- preSetup express hook to add middleware as body-parser, static files or authentication layers
- postSetup express hook to add fall through handler or add custom routs

## 📦 Installation

Actyx-http-connector is available as a [npm package](https://www.npmjs.com/package/@actyx-contrib/actyx-http-connector).

```shell
npm install @actyx-contrib/actyx-http-connector
```

# 📖 Documentation

You can access the full API documentation and related examples by visiting: [https://actyx-contrib.github.io/actyx-http-connector](https://actyx-contrib.github.io/actyx-http-connector/)

# Detailed Examples

You will find a detailed examples [here](https://github.com/actyx-contrib/actyx-http-connector/tree/master/example).

You can start them with `npm i && npm run example:simple` or `npm i && npm run example:advanced`.

After building the projects you can access an non-Actyx-App-Ui that use the started Http-Connector at http://localhost:1234. Please verify the port with the console output during build.

# 🤓 Quick start

## 🌊 `httpConnector`

Use the `httpConnector()` function to build the Http-connector. In this example you will find more information about the possible parameter

### Minimal example:

```typescript
import { httpConnector, registryEntry } from '../../src'
import { Pond } from '@actyx/pond'
// Api Server
Pond.default().then(pond => {
  httpConnector({
    // The pond instance is required for the http-connector
    pond,
    // Allows the user of the Http-Connector to emit events directly into actyx.
    // It is not recommended to use this feature.
    // Please use `eventEmitters` or at least add an authentication with `preSetup`
    allowEmit: true,
    // Propagate which fish you like to access from external programs.
    // The fish will be published over the http get request or can be observed with the websocket
    registry: { someFish: registryEntry(SomeFish.of) },
  })
})
```

### Complete example:

```typescript
import { httpConnector, registryEntry } from '../../src'
import { Pond } from '@actyx/pond'
// Api Server
Pond.default().then(pond => {
  httpConnector({
    // The pond instance is required for the http-connector
    pond,
    // Propagate which fish you like to access from external programs.
    // The fish will be published over the http get request or can be observed with the websocket
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
