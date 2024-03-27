import {Logger} from "./types"

function log(level: string, msg: string) {
  console.log(`${Date.now()} [${level}] ${msg}`)
}

export default function createLogger(): Logger {
  return {
    info: (msg) => log("info", msg),
    error: (msg) => log("error", msg),
  }
}
