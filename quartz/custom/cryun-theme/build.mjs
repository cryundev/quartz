import { build } from "esbuild"
import { fileURLToPath } from "node:url"

const directory = fileURLToPath(new URL(".", import.meta.url))
const script = await build({
  absWorkingDir: directory,
  entryPoints: ["src/theme.inline.ts"],
  bundle: true,
  write: false,
  format: "iife",
  platform: "browser",
})

await build({
  absWorkingDir: directory,
  entryPoints: {
    index: "src/index.ts",
    components: "src/components.ts",
    frame: "src/CryunFrame.tsx",
  },
  outdir: "dist",
  bundle: true,
  format: "esm",
  platform: "node",
  packages: "external",
  jsx: "automatic",
  jsxImportSource: "preact",
  define: { CRYUN_THEME_SCRIPT: JSON.stringify(script.outputFiles[0].text) },
})
