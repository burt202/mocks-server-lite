import * as bodyParser from "body-parser"
import express from "express"

import createLogger from "./logger"
import {Collection, Config, Route, Server} from "./types"
import {
  validateCollections,
  validateRoutes,
  getSelectedCollection,
  getEndpointsForCollection,
} from "./utils"

let loadedRoutes: Array<Route> = []
let loadedCollections: Array<Collection> = []

let router = express.Router()

const logger = createLogger()

function createEndpoints(
  config: Config,
  loadedRoutes: Array<Route>,
  selectedCollection: Collection,
) {
  router = express.Router()

  const endpoints = getEndpointsForCollection(selectedCollection, loadedRoutes)

  endpoints.forEach((e) => {
    const method = e.method.toLowerCase() as
      | "get"
      | "post"
      | "put"
      | "delete"
      | "patch"

    router[method](e.url, (req, res) => {
      logger.info(`Calling ${e.id}:${e.variant.id} - ${e.method} ${e.url}`)

      const delay = e.variant.delay ? e.variant.delay : config.delay ?? 0

      setTimeout(() => {
        res.status(e.variant.options.status)
        res.send(e.variant.options.body)
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

  return {
    start: async ({
      routes,
      collections,
    }: {
      routes: Array<Route>
      collections: Array<Collection>
    }) => {
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

      createEndpoints(config, loadedRoutes, selectedCollection)

      const port = config.port ?? 3000

      app.use(bodyParser.urlencoded({extended: false}))
      app.use(bodyParser.json())

      app.use(function replaceableRouter(req, res, next) {
        router(req, res, next)
      })

      app.use((req, res) => {
        logger.error(`${req.url} not found`)
        res.sendStatus(404)
      })

      app.listen(port, () => {
        logger.info(`Mocks server listening on port ${port}`)
      })

      return Promise.resolve()
    },
  }
}

export * from "./types"
