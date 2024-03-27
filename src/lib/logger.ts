import {format} from "date-fns"

import {Logger} from "./types"

function log(level: string, msg: string) {
  console.log(`${format(new Date(), "HH:mm:ss:SS")} [${level}] ${msg}`)
}

export default function createLogger(): Logger {
  return {
    info: (msg) => log("info", msg),
    error: (msg) => log("error", msg),
  }
}
