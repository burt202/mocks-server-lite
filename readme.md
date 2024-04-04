# Mocks Server Lite

Credit: This is heavily inspired by [mocks-server](https://github.com/mocks-server/main) and takes some of the main concepts from it. It is massively simplified though, currently with only the core functionality as well as being TypeScript first. I created this because the `mocks-server` project seems to be inactive and doesnt come with types and a few other features I think is key, which are listed below.

### Introduction

Node.js mock server running live, interactive mocks in place of real APIs. **It makes able to define many different responses for a same route**, so, you can change the whole mocked API behavior by simply changing the response of one or many routes while the server is running. This really helps with local FrontEnd development when the BackEnd isnt ready/available and also really good for automated test runs where you want to change how the backing server behaves whilst it is still running.

[Installation/Getting Started](https://github.com/burt202/mocks-server-lite/blob/main/docs/learn.md)

### Main Features

- define multiple mock responses ([variants](https://github.com/burt202/mocks-server-lite/blob/main/docs/learn.md#variants)) for api endpoints ([routes](https://github.com/burt202/mocks-server-lite/blob/main/docs/learn.md#routes))
- group together route mock responses in [collections](https://github.com/burt202/mocks-server-lite/blob/main/docs/learn.md#collections)
- [change route responses](https://github.com/burt202/mocks-server-lite/blob/main/docs/learn.md#change-collection) without having to restart the mocks server
- support route middleware
- add response delays with route override
- route call count so you can return something different on subsequent calls
- [web sockets](https://github.com/burt202/mocks-server-lite/blob/main/docs/learn.md#web-sockets) support

[Learn more...](https://github.com/burt202/mocks-server-lite/blob/main/docs/learn.md)

### Example Repo

[https://github.com/burt202/mocks-server-lite-example](https://github.com/burt202/mocks-server-lite-example)

- all mocking code is in `mocks/`, with the mock server being created in `mocks/server.ts`
- also see how the playwright test run can change the behaviour of the mocks server by caling `setMockCollection` which in turn calls `POST /__set-collection` with a new collection name
