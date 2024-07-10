import * as bodyParser from "body-parser"
import cors from "cors"
import express from "express"
import server from "http"
import webSocket from "ws"

import createLogger from "./logger"
import {Collection, Config, Route, Server} from "./types"
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

let callCounts: Record<string, number> = {}

let router = express.Router()

const logger = createLogger()

function addToCallCount(url: string) {
  if (callCounts[url]) {
    callCounts[url] = callCounts[url] + 1
  } else {
    callCounts[url] = 1
  }
}

function createEndpoints(
  config: Config,
  loadedRoutes: Array<Route>,
  selectedCollection: Collection,
) {
  router = express.Router()

  callCounts = {}
  const endpoints = getEndpointsForCollection(selectedCollection, loadedRoutes)

  endpoints.forEach((e) => {
    const method = e.method.toLowerCase() as
      | "get"
      | "post"
      | "put"
      | "delete"
      | "patch"

    const middlewares =
      e.variant.type === "handler" ? e.variant.middleware ?? [] : []

    router[method](e.url, ...middlewares, (req, res) => {
      logger.info(`Calling ${e.id}:${e.variant.id} - ${e.method} ${e.url}`)
      addToCallCount(req.url)

      const delay = e.variant.delay ? e.variant.delay : config.delay ?? 0
      const variantType = e.variant.type

      setTimeout(() => {
        switch (variantType) {
          case "json": {
            res.status(e.variant.response.status)
            res.send(e.variant.response.body)
            break
          }
          case "handler": {
            e.variant.response(req, res, {callCount: callCounts[req.url]})
            break
          }
        }
      }, delay)
    })
  })

  router.post(
    "/__set-collection",
    (req: {body: {collection?: string}}, res) => {
      const selectedCollection = getSelectedCollection(
        logger,
        loadedCollections,
        req.body.collection,
      )

      logger.info(`Using collection: ${selectedCollection.id}`)

      createEndpoints(config, loadedRoutes, selectedCollection)

      res.send("OK")
    },
  )
}

export const createServer = (config: Config): Server => {
  const app = express()
  const httpServer = server.createServer(app)

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

      // Create endpoints and middlewares

      createEndpoints(config, loadedRoutes, selectedCollection)

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
          logger.info(`'${s.from}' being served at: ${s.to}`)
        })
      }

      // Add root/fallback routes & start server

      app.get("/", (req, res) => res.sendStatus(200))

      app.use((req, res) => {
        logger.error(`${req.url} not found`)
        res.sendStatus(404)
      })

      const port = config.port ?? 3000

      httpServer.listen(port, () => {
        logger.info(`Mocks server listening on port ${port}`)
      })

      // Load websockets

      if (webSockets) {
        const webSocketsResult = validateWebSockets(webSockets)

        if ("error" in webSocketsResult) {
          logger.error(webSocketsResult.message)
          process.exit(1)
        }

        webSockets.forEach((s) => {
          const wss = new webSocket.Server({server: httpServer, path: s.path})
          logger.info(
            `Mock '${s.id}' web socket server running at path: ${s.path}`,
          )
          s.handler(wss)
        })
      }

      return Promise.resolve()
    },
  }
}

export * from "./types"
