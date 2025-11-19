import chalk from "chalk"
import {format} from "date-fns"

import {Logger} from "./types"

function log(level: string, msg: string) {
  console.info(`${format(new Date(), "HH:mm:ss:SSS")} [${level}] ${msg}`)
}

export default function createLogger(): Logger {
  return {
    info: (msg) => log(chalk.green("info"), msg),
    error: (msg) => log(chalk.red("error"), msg),
  }
}
