import * as express from "express"
import {Express} from "express"

import {Collection, Config, Route, Server} from "./types"
import {
  validateCollections,
  validateRoutes,
  getSelectedCollection,
} from "./utils"

let loadedRoutes: Array<Route> = []
let loadedCollections: Array<Collection> = []

function createEndpoints(
  app: Express,
  config: Config,
  selectedCollection: Collection,
) {
  console.log(
    "app, config, selectedCollection",
    app,
    config,
    selectedCollection,
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

      createEndpoints(app, config, selectedCollection)

      const port = config.port ?? 3000

      app.post(
        "/__set-collection",
        (req: {body: {collection?: string}}, res) => {
          const selectedCollection = getSelectedCollection(
            loadedCollections,
            req.body.collection,
          )

          console.log(`Using collection: ${selectedCollection.id}`)

          createEndpoints(app, config, selectedCollection)

          res.send("OK")
        },
      )

      app.listen(port, () => {
        console.log(`Mocks server listening on port ${port}`)
      })

      return Promise.resolve()
    },
  }
}
