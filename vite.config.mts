import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  test: {
     onConsoleLog(log: string, type: 'stdout' | 'stderr'): false | void {
      console.log("log in test: ", log);
      if (log === "message from third party library" && type === "stdout") {
        return false;
      }
    }
  },
  plugins: [tsconfigPaths()],
});