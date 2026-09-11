import type { QuartzTransformerPlugin } from "../../../plugins/types"
import type { Root } from "hast"
import type { VFile } from "vfile"

// Give the generated empty-home view the site's name in tabs and search metadata.
// Authored home titles and bodies remain owned by the Markdown document.
export const CryunHomeMetadata: QuartzTransformerPlugin = () => ({
  name: "CryunHomeMetadata",
  htmlPlugins: ({ cfg }) => [
    () => (tree: Root, file: VFile) => {
      if (
        file.data.slug === "index" &&
        file.data.frontmatter?.title === "index" &&
        tree.children.every((node) => node.type === "text" && node.value.trim() === "")
      ) {
        file.data.frontmatter.title = cfg.configuration.pageTitle
      }
    },
  ],
})
