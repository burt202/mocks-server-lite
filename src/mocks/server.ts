import {createServer} from "../lib"
import collections from "./collections"
import routes from "./routes"

const server = createServer({
  delay: 1000,
  selected: process.env.SELECTED_MOCKS_COLLECTION ?? "base",
})

void server.start({routes, collections})
