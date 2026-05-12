import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.spec.ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  maxWorkers: 1,
  testTimeout: 20000,
};

export default config;
