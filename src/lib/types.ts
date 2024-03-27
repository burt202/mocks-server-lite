import {z} from "zod"

const routeVariantSchema = z.object({
  id: z.string(),
  type: z.union([z.literal("json"), z.literal("middleware")]),
  options: z.object({
    status: z.number(),
    body: z.unknown(),
  }),
})

export const routeSchema = z.object({
  id: z.string(),
  url: z.string(),
  method: z.union([
    z.literal("GET"),
    z.literal("POST"),
    z.literal("PUT"),
    z.literal("PATCH"),
    z.literal("DELETE"),
  ]),
  variants: z.array(routeVariantSchema),
})

export type Route = z.infer<typeof routeSchema>

export const collectionSchema = z.object({
  id: z.string(),
  routes: z.array(z.string()),
})

export type Collection = z.infer<typeof collectionSchema>

export interface Config {
  delay?: number
  selected?: string
  port?: string
}

interface Loaders {
  loadRoutes: (routes: Array<Route>) => void
  loadCollections: (collections: Array<Collection>) => void
}

export interface Server {
  start: () => Promise<void>
  createLoaders: () => Loaders
}
