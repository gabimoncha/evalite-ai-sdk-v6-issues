import { defineConfig } from "evalite/config";

export default defineConfig({
  testTimeout: 90_000,
  maxConcurrency: 1,
  setupFiles: ["dotenv/config"],
});