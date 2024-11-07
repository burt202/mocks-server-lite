import * as bodyParser from "body-parser"
import cors from "cors"
import express from "express"
import http from "http"
import * as stream from "node:stream"
import webSocket, {WebSocket} from "ws"

import createLogger from "./logger"
import {
  CallLogEntry,
  Collection,
  Config,
  Route,
  Server,
  WebSocketHandler,
  WsReq,
} from "./types"
import {
  validateCollections,
  validateRoutes,
  getSelectedCollection,
  getEndpointsForCollection,
  validateWebSockets,
  validateStaticPaths,
} from "./utils"

let loadedRoutes: Array<Route> = []
let loadedCollections: Array<Collection> = []

let callLogs: CallLogEntry[] = []

let router = express.Router()

const logger = createLogger()

function addCallToLogs(req: express.Request) {
  callLogs.push({
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    path: req.path,
    params: req.params,
    query: req.query,
  })
}

function createEndpoints(
  config: Config,
  loadedRoutes: Array<Route>,
  selectedCollection: Collection,
  webSockets?: Array<WebSocketHandler>,
) {
  router = express.Router()

  callLogs = []
  const endpoints = getEndpointsForCollection(selectedCollection, loadedRoutes)

  endpoints.forEach((e) => {
    const method = e.method.toLowerCase() as
      | "get"
      | "post"
      | "put"
      | "delete"
      | "patch"

    const middlewares =
      e.variant.type === "handler" ? (e.variant.middleware ?? []) : []

    router[method](e.url, ...middlewares, (req, res) => {
      logger.info(`Calling ${e.id}:${e.variant.id} - ${e.method} ${e.url}`)

      const previous = callLogs.filter((c) => {
        return c.method === req.method && c.path === req.path
      })

      addCallToLogs(req)

      const delay = e.variant.delay ? e.variant.delay : (config.delay ?? 0)
      const variantType = e.variant.type

      setTimeout(() => {
        switch (variantType) {
          case "json": {
            res.status(e.variant.response.status)
            res.send(e.variant.response.body)
            break
          }
          case "handler": {
            e.variant.response(req, res, {callLogs, previous})
            break
          }
        }
      }, delay)
    })
  })

  router.post(
    "/__set-collection",
    (req: {body: {collection?: string; log?: string}}, res) => {
      const selectedCollection = getSelectedCollection(
        logger,
        loadedCollections,
        req.body.collection,
      )

      logger.info(`------------------------------------------`)

      if (req.body.log) {
        logger.info(req.body.log)
      }

      logger.info(`Using collection: ${selectedCollection.id}`)

      createEndpoints(config, loadedRoutes, selectedCollection, webSockets)

      res.send("OK")
    },
  )

  // Load websockets

  if (!webSockets) return

  webSockets.forEach((s) => {
    const wss = new webSocket.Server({
      noServer: true,
      path: s.path,
    })

    logger.info(`Mock '${s.id}' web socket server running at path: ${s.path}`)

    router.get(s.path, (req, res, next) => {
      const wsReq = req as WsReq

      if (!req.headers.upgrade || s.path !== req.path) {
        next()
      } else {
        wss.handleUpgrade(
          req,
          wsReq.ws.socket,
          wsReq.ws.head,
          (ws: WebSocket) => {
            logger.info(`Connected to '${s.id}' web socket`)

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/unbound-method
            const original = ws.send as any

            ws.send = (...args: Parameters<typeof original>) => {
              logger.info(`Sending message from '${s.id}' web socket`)
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
              return original.apply(ws, args)
            }

            s.handler(ws)
          },
        )
      }
    })
  })
}

export const createServer = (config: Config): Server => {
  const app = express()
  const server = http.createServer(app)

  server.on("upgrade", (req: WsReq, socket: stream.Duplex, head: Buffer) => {
    const res = new http.ServerResponse(req)
    req.ws = {socket, head}
    app(req, res)
  })

  return {
    start: async ({routes, collections, webSockets, staticPaths}) => {
      // Load routes

      const routesResult = validateRoutes(routes)

      if ("error" in routesResult) {
        logger.error(routesResult.message)
        process.exit(1)
      }

      loadedRoutes = routes

      // Load collections

      const collectionsResult = validateCollections(collections, loadedRoutes)

      if ("error" in collectionsResult) {
        logger.error(collectionsResult.message)
        process.exit(1)
      }

      loadedCollections = collections

      const selectedCollection = getSelectedCollection(
        logger,
        loadedCollections,
        config.selected,
      )

      logger.info(`Using collection: ${selectedCollection.id}`)

      // Validate web sockets

      if (webSockets) {
        const webSocketsResult = validateWebSockets(webSockets)

        if ("error" in webSocketsResult) {
          logger.error(webSocketsResult.message)
          process.exit(1)
        }
      }

      // Create endpoints and middlewares

      createEndpoints(config, loadedRoutes, selectedCollection, webSockets)

      app.use(bodyParser.urlencoded({extended: false}))
      app.use(bodyParser.json())

      app.use(cors())

      app.use(function replaceableRouter(req, res, next) {
        router(req, res, next)
      })

      // Load static paths

      if (staticPaths) {
        const staticPathsResult = validateStaticPaths(staticPaths)

        if ("error" in staticPathsResult) {
          logger.error(staticPathsResult.message)
          process.exit(1)
        }

        staticPaths.forEach((s) => {
          app.use(s.to, express.static(s.from))
          logger.info(`Path '${s.from}' being served at: ${s.to}`)
        })
      }

      // Add root/fallback routes & start server

      app.get("/", (req, res) => res.sendStatus(200))

      app.use((req, res) => {
        logger.error(`${req.url} not found`)
        res.sendStatus(404)
      })

      const port = config.port ?? 3000

      server.listen(port, () => {
        logger.info(`Mocks server listening on port ${port}`)
        logger.info(`------------------------------------------`)
      })

      return Promise.resolve()
    },
  }
}

export * from "./types"
