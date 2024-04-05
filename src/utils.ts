import {
  Collection,
  collectionSchema,
  Logger,
  Route,
  routeSchema,
  WebSocketHandler,
  webSocketHandlerSchema,
} from "./types"

export const validateRoutes = (
  routes: Array<Route>,
): {success: true} | {error: true; message: string} => {
  const invalid = routes.filter((r) => {
    const validatedResponse = routeSchema.safeParse(r)
    return !validatedResponse.success
  })

  if (invalid.length) {
    return {error: true, message: "One or more routes not in expected shape"}
  }

  const ids = routes.map((r) => r.id)
  const duplicates = findDuplicates(ids)

  if (duplicates.length) {
    return {
      error: true,
      message: `Route with id '${duplicates[0]}' already exists`,
    }
  }

  return {success: true}
}

export const validateCollections = (
  collections: Array<Collection>,
  loadedRoutes: Array<Route>,
): {success: true} | {error: true; message: string} => {
  const invalid = collections.filter((r) => {
    const validatedResponse = collectionSchema.safeParse(r)
    return !validatedResponse.success
  })

  if (invalid.length) {
    return {
      error: true,
      message: "One or more collections not in expected shape",
    }
  }

  if (collections.length === 0) {
    return {
      error: true,
      message: "No collections found",
    }
  }

  const ids = collections.map((c) => c.id)
  const duplicates = findDuplicates(ids)

  if (duplicates.length) {
    return {
      error: true,
      message: `Collection with id '${duplicates[0]}' already exists`,
    }
  }

  const allVariants = loadedRoutes.flatMap((r) => {
    return r.variants.map((v) => {
      return `${r.id}:${v.id}`
    })
  })

  try {
    collections.forEach((c) => {
      c.routes.forEach((r) => {
        if (!allVariants.includes(r)) {
          throw new Error(`Route: ${r} not found for collection: ${c.id}`)
        }
      })
    })
  } catch (e: unknown) {
    const err = e as Error
    return {
      error: true,
      message: err.message,
    }
  }

  return {success: true}
}

export const validateWebSockets = (
  webSockets: Array<WebSocketHandler>,
): {success: true} | {error: true; message: string} => {
  const invalid = webSockets.filter((r) => {
    const validatedResponse = webSocketHandlerSchema.safeParse(r)
    return !validatedResponse.success
  })

  if (invalid.length) {
    return {
      error: true,
      message: "One or more web sockets not in expected shape",
    }
  }

  const ids = webSockets.map((ws) => ws.id)
  const duplicates = findDuplicates(ids)

  if (duplicates.length) {
    return {
      error: true,
      message: `Web socket with id '${duplicates[0]}' already exists`,
    }
  }

  return {success: true}
}

export function getSelectedCollection(
  logger: Logger,
  loadedCollections: Array<Collection>,
  name?: string,
) {
  if (!name) return loadedCollections[0]

  const found = loadedCollections.find((c) => c.id === name)
  if (found) return found

  logger.error(`Collection ${name} not found`)

  return loadedCollections[0]
}

export function getEndpointsForCollection(
  collection: Collection,
  routes: Array<Route>,
) {
  return collection.routes.flatMap((r) => {
    const parts = r.split(":")
    const routeId = parts[0]
    const variantId = parts[1]

    const routeMatch = routes.find((lr) => lr.id === routeId)
    if (!routeMatch) return []

    const variantMatch = routeMatch.variants.find((v) => v.id === variantId)
    if (!variantMatch) return []

    return [
      {
        id: routeMatch.id,
        url: routeMatch.url,
        method: routeMatch.method,
        variant: variantMatch,
      },
    ]
  })
}

function findDuplicates(arr: Array<string>) {
  const duplicates: Array<string> = []

  arr.reduce(
    (acc, cur) => {
      if (acc[cur]) {
        duplicates.push(cur)
      } else {
        acc[cur] = true
      }

      return acc
    },
    {} as Record<string, boolean>,
  )

  return duplicates
}
