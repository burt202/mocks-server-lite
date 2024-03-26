import {Route} from "../../lib/types"

const USERS = [
  {
    id: 1,
    name: "John Doe",
  },
  {
    id: 2,
    name: "Jane Doe",
  },
]

const ALL_USERS = [
  ...USERS,
  {
    id: 3,
    name: "Tommy",
  },
  {
    id: 4,
    name: "Timmy",
  },
]

const route: Route = {
  id: "get-users",
  url: "/api/users",
  method: "GET",
  variants: [
    {
      id: "success",
      type: "json",
      options: {
        status: 200,
        body: USERS,
      },
    },
    {
      id: "all",
      type: "json",
      options: {
        status: 200,
        body: ALL_USERS,
      },
    },
    {
      id: "error",
      type: "json",
      options: {
        status: 400,
        body: {
          message: "Error",
        },
      },
    },
  ],
}

export default route
