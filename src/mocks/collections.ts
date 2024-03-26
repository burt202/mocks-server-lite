import {Collection} from "../lib/types"

const collections: Array<Collection> = [
  {
    id: "base",
    routes: ["get-users:success"],
  },
  {
    id: "all-users",
    routes: ["get-users:all"],
  },
]

export default collections
