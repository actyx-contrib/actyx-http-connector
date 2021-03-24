<img width="130px" src="https://raw.githubusercontent.com/actyx-contrib/actyx-HTTP-Connector/master/icon.png?token=AATHWQIC5RWS62GY3OINH3C645MHQ">

# Actyx-HTTP-Connector

Need connector to talk an Actyx swarm from external applcations via HTTP?

`Actyx-HTTP-Connector` allows you to build one in a few of minutes while keeping the embedded HTTP server fully customizeable.

## ✨ Features

The HTTP connector allows you to interact with a swarm of Actyx nodes by providing an HTTP interface to systems not running Actyx.
You can use it to ...

* ... inject data from other systems that will be injected into the Actyx swarm in the form of events (think webhooks)
* ... query fish state from non-Actyx applications to show data from Actyx in other apps (e.g. legacy Web-Apps)
* ... get updates from the Actyx swarm via websockets

The connector provides hooks you can use to influence the behaviour of the underlying HTTP server/web framework, [Express](https://expressjs.com/). You can use these hooks to ...

* ... add middlewares like body-parsers or authentication
* ... add static file resources
* ... provide additional routes or catch-all route handlers

Additionally, you can query information from like your local source Id, the Pond state, swarm connectivity and whether the node running the HTTP connector is in sync with the swarm to be able to deal with error conditions better.

## ⚖️ Trade-Offs

Note, however, that web apps running on the HTTP connector do not provide the same level of resilience that Actyx Apps do. These applications are not distributed and run on a central server.

This is typically not an issue when interfacing with external systems (top floor, back office). But you should probably not use it to build applications that run on the shof floor and need to be highly available and resilient.
## 📦 Installation

Actyx-HTTP-Connector is available as a [npm package](https://www.npmjs.com/package/@actyx-contrib/actyx-http-connector).

```shell
npm install @actyx-contrib/actyx-http-connector
```

# 📖 Documentation

The complete API documentation and related examples are available at [https://actyx-contrib.github.io/actyx-HTTP-Connector](https://actyx-contrib.github.io/actyx-http-connector/)

# Detailed Examples

You can find sample applications [on GitHub](https://github.com/actyx-contrib/actyx-http-connector/tree/master/example).

The `simple` example exposes the possibility to query fish state and emit events to the Pond directly. The `advanced` example adds web socket communication, uses event emitters and adds authentication. Both projects come with a simple react app. Note that these apps do _not_ directly talk to an Actyx node but interface through the HTTP connector.

Make sure you have an Axtyx node running on your machine before starting the examples. You can get the binaries from [our download site](https://downloads.actyx.com/).

You can start the examples using `npm i && npm run example:simple` or `npm i && npm run example:advanced`, respectivly. The apps are accessible at http://localhost:1234. If that port is already allocated, the build picks another one at random. Check the build's console output to be sure.

# 🤓 Quick start

To have access to your Actyx fish definitions and the Pond, it is best to create your HTTP server as part of an (probably already existing) [axp](https://github.com/actyx-contrib/actyx-project-cli) project.


```sh
$ cd <my project folder>
$ axp init # only if you do not already have an Actxy project in place
$ axp add node --appName http-api 
$ cd src/http-api
$ npm install @actyx-contrib/actyx-http-connector --save
```

## 🔌  Add `httpConnector`

In your `http-api` app's `index.ts`, import the HTTP connector, then use `httpConnector()` to create a server instance as shown below.
For further details, please refer to the docs and the examples.

```ts
import { httpConnector, registryEntry } from '@actyx-contrib/actyx-http-connector'

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

# Minimal example

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

# Complete example

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
