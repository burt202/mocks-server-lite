import * as express from "express"

import {
  Collection,
  Config,
  Route,
  Server,
  collectionSchema,
  routeSchema,
} from "./types"

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
          const invalid = routes.filter((r) => {
            const validatedResponse = routeSchema.safeParse(r)
            return !validatedResponse.success
          })

          if (invalid.length) {
            throw new Error("One or more routes not in expected shape")
          }

          loadedRoutes = routes
        },
        loadCollections: (collections) => {
          const invalid = collections.filter((r) => {
            const validatedResponse = collectionSchema.safeParse(r)
            return !validatedResponse.success
          })

          if (invalid.length) {
            throw new Error("One or more collections not in expected shape")
          }

          if (collections.length === 0) {
            throw new Error("No collections found")
          }

          const allVariants = loadedRoutes.flatMap((r) => {
            return r.variants.map((v) => {
              return `${r.id}:${v.id}`
            })
          })

          collections.forEach((c) => {
            c.routes.forEach((r) => {
              if (!allVariants.includes(r)) {
                throw new Error(`Route: ${r} not found for collection: ${c.id}`)
              }
            })
          })

          loadedCollections = collections

          // TODO set selected collection
        },
      }
    },
  }
}
