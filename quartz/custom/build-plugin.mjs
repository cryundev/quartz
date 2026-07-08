import { build } from "esbuild"
import fs from "fs"
import path from "path"

const pluginDir = process.cwd()
const srcDir = path.join(pluginDir, "src")
const entryPoints = {}

const indexEntry = path.join(srcDir, "index.ts")
if (fs.existsSync(indexEntry)) {
  entryPoints.index = indexEntry
}

const componentsEntry = path.join(srcDir, "components", "index.ts")
if (fs.existsSync(componentsEntry)) {
  entryPoints["components/index"] = componentsEntry
}

const framesEntry = path.join(srcDir, "frames", "index.ts")
if (fs.existsSync(framesEntry)) {
  entryPoints["frames/index"] = framesEntry
}

if (Object.keys(entryPoints).length === 0) {
  throw new Error(`No plugin entry points found in ${srcDir}`)
}

await build({
  entryPoints,
  outdir: path.join(pluginDir, "dist"),
  bundle: true,
  format: "esm",
  platform: "node",
  packages: "external",
  logLevel: "info",
})
