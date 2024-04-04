### Routes

TODO

### Variants

TODO

### Collections

TODO

### Change Collection

You change the collection of routes/variants whilst the server is running by called a utility endpoint:

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
