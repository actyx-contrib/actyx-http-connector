# IMPORTANT NOTICE

**This repository has been archived and is no longer maintained. You are welcome to copy the code into your own projects and continue using it at your own discretion and risk.**

<img width="130px" src="https://raw.githubusercontent.com/actyx-contrib/actyx-HTTP-Connector/master/icon.png?token=AATHWQIC5RWS62GY3OINH3C645MHQ">

# Actyx-HTTP-Connector

Need a connector to talk to an Actyx swarm from external applications via HTTP?

`Actyx-HTTP-Connector` allows you to build one in a few minutes while keeping the embedded HTTP server fully customizable.

## ✨ Features

The HTTP connector allows you to interact with a swarm of Actyx nodes by providing an HTTP interface to systems not running Actyx.
You can use it to ...

- ... inject data from other systems that will be injected into the Actyx swarm in the form of events (think webhooks)
- ... query [Fish](https://developer.actyx.com/docs/pond/guides/hello-world) state from non-Actyx applications to show data from Actyx in other apps (e.g. legacy web apps)
- ... get updates from the Actyx swarm via WebSockets

The connector provides hooks you can use to influence the behavior of the underlying HTTP server/web framework, [Express](https://expressjs.com/). You can use these hooks to ...

- ... add middleware like encryption, body-parsers or authentication
- ... add static file resources
- ... provide additional routes or catch-all route handlers

Additionally, you can query information like your local source ID, the [Pond](https://developer.actyx.com/docs/pond/introduction/ state, and whether the node running the HTTP connector is in sync with the swarm to be able to deal with error conditions better.

## ⚖️ Trade-Offs

Note, however, that web apps running on the HTTP connector do not provide the same level of resilience that Actyx apps do.

This is typically not an issue when interfacing with external systems (top floor, back office). But you should probably not use it to build applications that run on the shop floor and need to be highly available and resilient.

## 📦 Installation

`Actyx-HTTP-Connector` is available as an [npm package](https://www.npmjs.com/package/@actyx-contrib/actyx-http-connector).

```shell
npm install @actyx-contrib/actyx-http-connector
```

# 📖 Documentation

The complete API documentation and related examples are available at [https://actyx-contrib.github.io/actyx-HTTP-Connector](https://actyx-contrib.github.io/actyx-http-connector/)

# Detailed Examples

You can find sample applications [on GitHub](https://github.com/actyx-contrib/actyx-http-connector/tree/master/example).

The `simple` example exposes the possibility to query Fish state and emit events to the Pond directly. The `advanced` example adds WebSocket communication, uses event emitters and adds authentication. Both projects come with a simple [React](https://reactjs.org/) based app. Note that these apps do _not_ directly talk to an Actyx node but interface through the HTTP connector.

Make sure you have an Axtyx node running on your machine before starting the examples. You can get the binaries from [our download site](https://downloads.actyx.com/).

You can start the examples using `npm i && npm run example:simple` or `npm i && npm run example:advanced`, respectively. The apps are accessible at http://localhost:1234. If that port is already allocated, the build picks another one at random. Check the build's console output to be sure.

# 🤓 Quick start

To have access to your Actyx Fish definitions and the Pond, it is best to create your HTTP server as part of an (probably already existing) [axp](https://github.com/actyx-contrib/actyx-project-cli) project.

```sh
$ cd <my project folder>
$ axp init # only if you do not already have an Actyx project in place
$ axp add node --appName http-api
$ npm install @actyx-contrib/actyx-http-connector --save
```

## 🔌 Add `httpConnector`

In your `http-api` app's `index.ts`, import the HTTP connector, then use `httpConnector()` to create a server instance as shown below.
For further details, please refer to the docs and the examples.

```ts
import { httpConnector, registryEntry } from '@actyx-contrib/actyx-http-connector'
import { Pond } from '@actyx/pond'

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
```

# 🤓 Examples

## Minimal example

The minimal example simply allows you to emit events directly into actyx using an HTTP API.

```ts
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

The complete example shows also shows how to hook in middlewares and the usage of event emitters.

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
    // this hook is added after urlencoded, json, cors, you could add XML parser,
    // cookie parser and other middleware you like
    preSetup: app => {
      app.use(xmlparser())
      // add Authentication
    },
    // Add a handler after the routes are added to express.
    // This could be used for a default "404 not-Found" page or a redirect to your documentation
    postSetup: app => {
      app.use((_req, res, _next) => res.redirect('https://community.actyx.com'))
    },
  })
})
```
