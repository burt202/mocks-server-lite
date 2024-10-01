import {Request, RequestHandler, Response} from "express"
import WebSocket from "ws"
import {z} from "zod"

const routeVariantBaseSchema = z.object({
  id: z.string(),
  delay: z.number().optional(),
})

type RouteVariantBase = z.infer<typeof routeVariantBaseSchema>

const routeVariantJsonSchema = routeVariantBaseSchema.extend({
  type: z.literal("json"),
  response: z.object({
    status: z.number(),
    body: z.unknown(),
  }),
})

export type RouteVariantJson = z.infer<typeof routeVariantJsonSchema>

const routeVariantHandlerSchema = routeVariantBaseSchema.extend({
  type: z.literal("handler"),
  middleware: z.array(z.function()).optional(),
  response: z.function(),
})

export interface CallLogEntry {
  timestamp: string
  method: Request["method"]
  url: Request["url"]
  path: Request["path"]
  params: Request["params"]
  query: Request["query"]
}

export interface ResponseHandlerCtx {
  callLogs: CallLogEntry[]
  previous: CallLogEntry[]
}

export type RouteVariantHandler<
  Params = object,
  Body = object,
  Query = object,
> = RouteVariantBase & {
  type: "handler"
  middleware?: Array<RequestHandler>
  response: (
    req: Request<Params, object, Body, Query>,
    res: Response,
    ctx: ResponseHandlerCtx,
  ) => void
}

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
  variants: z.array(
    z.union([routeVariantJsonSchema, routeVariantHandlerSchema]),
  ),
})

export type Route = Omit<z.infer<typeof routeSchema>, "variants"> & {
  variants: Array<RouteVariantJson | RouteVariantHandler>
}

export const collectionSchema = z.object({
  id: z.string(),
  routes: z.array(z.string()),
})

export type Collection = z.infer<typeof collectionSchema>

export interface Config {
  delay?: number
  selected?: string
  port?: number
}

export interface Logger {
  info: (msg: string) => void
  error: (msg: string) => void
}

export const webSocketHandlerSchema = z.object({
  id: z.string(),
  path: z.string(),
  handler: z.function(),
})

export type WebSocketServer = WebSocket.Server

export interface WebSocketHandlerCtx {
  logEvent: (eventType: "connected" | "messageSent") => void
}

export type WebSocketHandler = Omit<
  z.infer<typeof webSocketHandlerSchema>,
  "handler"
> & {
  handler: (wss: WebSocketServer, ctx: WebSocketHandlerCtx) => void
}

export const staticPathOptionsSchema = z.object({
  from: z.string(),
  to: z.string(),
})

export type StaticPathOptions = z.infer<typeof staticPathOptionsSchema>

export interface Server {
  start: ({
    routes,
    collections,
    webSockets,
  }: {
    routes: Array<Route>
    collections: Array<Collection>
    webSockets?: Array<WebSocketHandler>
    staticPaths?: Array<StaticPathOptions>
  }) => Promise<void>
}
