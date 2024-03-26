import * as express from "express"

import {Collection, Config, Route, Server} from "./types"
import {validateCollections, validateRoutes} from "./validators"

let loadedRoutes: Array<Route> = []
let loadedCollections: Array<Collection> = []

export const createServer = (config: Config): Server => {
  return {
    start: async () => {
      const app = express()

      const port = config.port ?? 3000

      app.listen(port, () => {
        console.log(`Mocks server listening on port ${port}`)
      })

      await Promise.resolve(loadedCollections) // TODO
    },
    createLoaders: () => {
      return {
        loadRoutes: (routes) => {
          const result = validateRoutes(routes)

          if ("error" in result) {
            throw new Error(result.message)
          }

          loadedRoutes = routes
        },
        loadCollections: (collections) => {
          const result = validateCollections(collections, loadedRoutes)

          if ("error" in result) {
            throw new Error(result.message)
          }

          loadedCollections = collections

          // TODO set selected collection
        },
      }
    },
  }
}
