import * as bodyParser from "body-parser"
import * as express from "express"

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
      console.log(`Calling ${e.id}:${e.variant.id} - ${e.method} ${e.url}`)

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
        loadedCollections,
        req.body.collection,
      )

      console.log(`Using collection: ${selectedCollection.id}`)

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
        throw new Error(routesResult.message)
      }

      loadedRoutes = routes

      // Load collections

      const collectionsResult = validateCollections(collections, loadedRoutes)

      if ("error" in collectionsResult) {
        throw new Error(collectionsResult.message)
      }

      loadedCollections = collections

      const selectedCollection = getSelectedCollection(
        loadedCollections,
        config.selected,
      )

      console.log(`Using collection: ${selectedCollection.id}`)

      createEndpoints(config, loadedRoutes, selectedCollection)

      const port = config.port ?? 3000

      app.use(bodyParser.urlencoded({extended: false}))
      app.use(bodyParser.json())

      app.use(function replaceableRouter(req, res, next) {
        router(req, res, next)
      })

      app.listen(port, () => {
        console.log(`Mocks server listening on port ${port}`)
      })

      return Promise.resolve()
    },
  }
}
