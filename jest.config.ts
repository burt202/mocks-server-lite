import type {Config} from "jest"

export default async (): Promise<Config> => {
  return {
    verbose: true,
    transform: {
      "^.+\\.tsx?$": "ts-jest",
    },
    testPathIgnorePatterns: ["<rootDir>/dist/"],
  }
}
