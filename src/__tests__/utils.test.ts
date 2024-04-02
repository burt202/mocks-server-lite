import {expect, describe, it} from "@jest/globals"

import {Collection, Route, WebSocketHandler} from "../types"
import {validateCollections, validateRoutes, validateWebSockets} from "../utils"

describe("validateRoutes", () => {
  it("should return error when passed routes doesnt match schema", () => {
    const routes = ["invalid"] as unknown as Array<Route>

    const res = validateRoutes(routes)

    expect(res).toEqual({
      error: true,
      message: "One or more routes not in expected shape",
    })
  })

  it("should return successfully when valid routes are passed", () => {
    const routes = [
      {
        id: "get-users",
        url: "/api/users",
        method: "GET" as const,
        variants: [
          {
            id: "success",
            type: "json" as const,
            response: {
              status: 200,
              body: [],
            },
          },
        ],
      },
    ]

    const res = validateRoutes(routes)

    expect(res).toEqual({success: true})
  })
})

describe("validateCollections", () => {
  it("should return error when passed collections doesnt match schema", () => {
    const collections = ["invalid"] as unknown as Array<Collection>

    const res = validateCollections(collections, [])

    expect(res).toEqual({
      error: true,
      message: "One or more collections not in expected shape",
    })
  })

  it("should return error when no collections are present", () => {
    const res = validateCollections([], [])

    expect(res).toEqual({
      error: true,
      message: "No collections found",
    })
  })

  it("should return error when collections reference an invalid route/variant pair", () => {
    const collections = [
      {
        id: "base",
        routes: ["get-users:success"],
      },
    ]

    const res = validateCollections(collections, [])

    expect(res).toEqual({
      error: true,
      message: "Route: get-users:success not found for collection: base",
    })
  })

  it("should return successfully when valid collections are passed", () => {
    const collections = [
      {
        id: "base",
        routes: ["get-users:success"],
      },
    ]

    const routes = [
      {
        id: "get-users",
        url: "/api/users",
        method: "GET" as const,
        variants: [
          {
            id: "success",
            type: "json" as const,
            response: {
              status: 200,
              body: [],
            },
          },
        ],
      },
    ]

    const res = validateCollections(collections, routes)

    expect(res).toEqual({success: true})
  })
})

describe("validateWebSockets", () => {
  it("should return error when passed web sockets doesnt match schema", () => {
    const webSockets = ["invalid"] as unknown as Array<WebSocketHandler>

    const res = validateWebSockets(webSockets)

    expect(res).toEqual({
      error: true,
      message: "One or more web sockets not in expected shape",
    })
  })

  it("should return successfully when valid web sockets are passed", () => {
    const webSockets = [
      {
        id: "get-users",
        path: "chat",
        handler: () => {},
      },
    ]

    const res = validateWebSockets(webSockets)

    expect(res).toEqual({success: true})
  })
})
