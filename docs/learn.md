### Installation/Getting Started

Add it to your project dev dependencies using NPM:

```
npm i -D mocks-server-lite
```

- Create a server file (see 'Server Config & Startup' section below)
- Add a script to `package.json`, below is an example for TypeScript using `tsx`:

```
{
  "scripts": {
    ...
    "mocks" : "npx tsx mocks/server.ts"
  }
}
```

This enables to start the server by simply running a command in the project folder.

```
npm run mocks
```

### Routes & Variants

Routes are for defining the endpoints you want to mock where each have a `url`, `method` and an array of `variants`. Variants are describing ways in which an endpoint can respond.

- You can add a `delay` to any variant to simulate response time, this overrides the global value if set
- Route id's should be unique across all routes, whereas variant id's only need to be unique within its route.

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

The `RouteVariantHandler` type takes three type params, the first for url params, the second for body and the third for query params, so everything can be properly typed.

The response handler function also gets passed a third parameter:

```
{
  callLogs: CallLogEntry[]
  previous: CallLogEntry[]
}

CallLogEntry = {
  timestamp: string
  method: string
  url: string
  path: string
  params: {}
  query: {}
}
```

`callLogs` keeps tracks of all endpoints called since the server started or the last collection change
`previous` an array of all previous calls in the call log that match the current method AND path. Useful if you wanted to return something different on subsequent calls.

**Route Middleware**

When using a `handler` response type, you can also pass an array of middleware to hand down to the underlying express route. See below for an example that uses `multer` to upload a file.

```
import {mkdirSync} from "fs"
import {Route} from "mocks-server-lite"
import multer from "multer"
import path from "path"

const UPLOAD_PATH = path.join(__dirname, "../uploads")

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    mkdirSync(UPLOAD_PATH, {recursive: true})
    cb(null, UPLOAD_PATH)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname)
  },
})

const upload = multer({storage})

const route: Route = {
  id: "upload-pic",
  url: "/api/profile",
  method: "POST",
  variants: [
    {
      id: "success",
      type: "handler",
      middleware: [upload.single("file")],
      response: (_, res) => {
        res.status(200)
        res.send({result: "Uploaded!"})
      },
    },
  ],
}

```

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

NOTE: You can pass an optional `log` body property if you want something specific to be logged when the collection is changed.

### Server Creation & Startup

Creating the server is very straight forward with minimal options:

```
import {createServer} from "mocks-server-lite"

void createServer(
  mocks, // {routes, collections, webSockets?, staticPaths?}
  config,
)
  .then((server) => {
    void server.start()
  })

```

`.createServer` mocks

This is where you pass in your routes, collections, web sockets and static paths.
Inputs from all 4 of these are validated internally to ensure they are the correct shape, the server will exit early if not.

Routes and collections are required, but web sockets & static paths are optional

`.createServer` config

| Option              | Type    | Required | Description                                                                                                                                                      |
| ------------------- | ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| delay               | number  | false    | Simulate response time by adding a global delay for every response, can be overriden by any individual route variant                                             |
| selected            | string  | false    | Choose which collection to start with, if nothing is supplied, or selected doesnt match a known collection, the first collection in the collections list is used |
| port                | number  | false    | Port on which to run the mock server, defaults to 3000                                                                                                           |
| skipSelectionPrompt | boolean | false    | Turn off collection selection on server start                                                                                                                    |

### Web Sockets

You can setup web socket mocks to be available when the mocks server is running, but unlike routes and collections though, the behaviours of these cannot change dynamically.

To mock a web socket, you can define a object as follows where the `id` is unique and the `path` defines the url the web socket will be running on.

```
import {WebSocketHandler} from "mocks-server-lite"

const chat: WebSocketHandler = {
  id: "chat",
  path: "/chat",
}
```

To add these, you just add them as an array when calling `server.start()`

You have two ways of sending messages from a web socket.

The first is by adding a static handler when you setup the web socket mock:

```
import {WebSocketHandler} from "mocks-server-lite"

const chat: WebSocketHandler = {
  id: "chat",
  path: "/chat",
  handler: (ws) => {
    setTimeout(() => {
      ws.send(JSON.stringify({message: "Hello world!"}))
    }, 2500)
  },
}
```

The second is by using the special internal endpoint to trigger a message programmatically:

```
fetch(`http://localhost:3000/__send-ws-message`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    id, // should match the id of the web socket mock
    message // object containing message to send from web socket
  }),
})
```

### Static Paths

You can setup static paths to serve file assets at specific paths when the mocks server is running, but unlike routes and collections though, the behaviours of these cannot change dynamically.

```
import {StaticPathOptions} from "mocks-server-lite"

const staticPaths: Array<StaticPathOptions> = [
  {
    from: __dirname + "/static",
    to: "/assets",
  },
]

```

To add these, you just add them as an array when calling `server.start()`
