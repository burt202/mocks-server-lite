import {Collection, collectionSchema, Route, routeSchema} from "./types"

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
