### Installation/Getting Started

Add it to your project dependencies using NPM:

```
npm i -D mocks-server-lite
```

Add a script to `package.json`, below is an example for TypeScript using `ts-node`:

```
{
  "scripts": {
    ...
    "mocks" : "npx ts-node mocks/server.ts"
  }
}
```

This enables to start the server by simply running a command in the project folder.

```
npm run mocks
```

### Routes & Variants

Routes are for defining the endpoints you want to mock where each have a `url`, `method` and an array of `variants`. Variants are describing ways in which an endpoint can respond.

Route id's should be unique across all routes, whereas variant id's only need to be unique within its route.

```
import {Route} from "mocks-server-lite"

const route: Route = {
  id: "login",
  url: "/api/login",
  method: "POST",
  variants: [
    {
      id: "success",
      type: "json",
      response: {
        status: 200,
        body: {result: "Ok!"},
      },
    },
    {
      id: "error",
      type: "json",
      response: {
        status: 400,
        body: {error: "Invalid credentials"},
      },
    },
  ],
}
```

Variants can be of `json` or `handler` type. The `json` type is shown above which is just for simple static responses. If you want to get access to the request object or write custom logic you can use the `handler` type.

```
const create: RouteVariantHandler<object, {name: string; role: string}> = {
  id: "success",
  type: "handler",
  response: (req, res) => {
    const {name, role} = req.body

    res.status(200)
    res.send({name, role})
  },
}

export const createUser: Route = {
  id: "create-users",
  url: "/api/users",
  method: "POST",
  variants: [create],
}
```

The `RouteVariantHandler` takes three type params, the first for url params, the second for body and the third for query params, so everything can be properly typed.

The response handler function also gets passed a third parameter:

```
{
  callCount: number
}
```

`callCount` keeps count of how many times an endpoint has been called since the server started or the last collection change. Useful if ou wanted to return something different on subsequent calls.

TODO middleware
TODO delay

### Collections

Collections are for grouping route variant responses together. The user can choose which collection the mock server uses and this can be changed without restarting the server.

```
import {Collection} from "mocks-server-lite"

const collections: Array<Collection> = [
  {
    "id": "all-users",
    "routes": ["get-users:success"]
  }
]
```

The `id` should be unique and is used to set the current collection either on server startup or via the `/__set-collection` endpoint.

The `routes` array should be a list of valid route/variant pairing in the form of `[routeId]:[variantId]`

You can have as many collections as you want, and each collection can have as many routes as you want

### Change Collection

You change the collection of routes/variants whilst the server is running by calling a utility endpoint:

```
fetch(`http://localhost:3000/__set-collection`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    collection: name,
  }),
})
```

This can be very useful during a test run, see the [example repo](https://github.com/burt202/mocks-server-lite-example) where it is used for playwright E2E tests

### Server Config & Startup

Creating the server is very straight forward with minimal options:

```
import {createServer} from "mocks-server-lite"

const server = createServer({
  delay?: number,
  selected?: string,
  port?: number,
})

void server.start({routes, collections, webSockets})
```

`.createServer` options

| ---      | ---                     | ---                                                                                                                                                              |
| -------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| delay    | optional, no default    | Simulate response time by adding a global delay for every response, can be overriden by any individual route                                                     |
| selected | optional, no default    | Choose which collection to start with, if nothing is supplied, or selected doesnt match a known collection, the first collection in the collections list is used |
| port     | optional, default: 3000 | Port on which to run the mock server                                                                                                                             |

`.start` options

This method just takes a single object where you pass in your routes, collections and web sockets.
Inputs from all 3 of these are validated internally to ensure they are the correct shape, the server will exit early if not.
Routes and collections are required, but web sockets are optional

### Web Sockets

You can setup web socket mocks to be available when the mocks server is running, but unlike routes and collections though, the behaviours of these cannot change dynamically.

```
import {WebSocketHandler} from "mocks-server-lite"

const chat: WebSocketHandler = {
  id: "chat",
  path: "/chat",
  handler: (wss) => {
    wss.on("connection", function connection(ws) {
      setTimeout(() => {
        ws.send(JSON.stringify({message: "Hello world!"}))
      }, 2500)
    })
  },
}
```

To add these, you just add them as an array when calling `server.start()`
