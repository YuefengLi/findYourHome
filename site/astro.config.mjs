import { defineConfig } from "astro/config";
import react from "@astrojs/react";

function normalizeBase(raw) {
  if (!raw || raw === "/") {
    return "/";
  }
  return `/${raw.replace(/^\/+|\/+$/g, "")}`;
}

export default defineConfig({
  integrations: [react()],
  output: "static",
  base: normalizeBase(process.env.BASE_PATH),
  build: {
    format: "file"
  }
});
