import { defineConfig } from "vite";
import { resolve } from "path";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],

  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        router: resolve(__dirname, "lib/index.js"),
      },
    },
  },
});
