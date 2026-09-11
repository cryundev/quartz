import type { QuartzPluginData } from "../../../plugins/vfile"
import type { FullSlug } from "../../../util/path"

export interface NavigationSection {
  slug: FullSlug
  segment: string
  title: string
}

const navigation = new WeakMap<QuartzPluginData[], NavigationSection[]>()

// Derive the menu from Quartz's published inputs; never mutate its files or trie.
export function getNavigationSections(allFiles: QuartzPluginData[]): NavigationSection[] {
  const cached = navigation.get(allFiles)
  if (cached) return cached
  const visible = allFiles.filter((file) => file.slug && !file.unlisted)
  const sections = new Map<string, NavigationSection>()
  for (const file of visible) {
    const [segment, child] = file.slug!.split("/")
    if (
      !child ||
      segment === "tags" ||
      !file.filePath?.endsWith(".md") ||
      file.slug!.endsWith("/index")
    )
      continue
    sections.set(segment, {
      slug: `${segment}/index` as FullSlug,
      segment,
      title: segment.replace(/^\d+[-_\s]+/, "").replace(/[-_]+/g, " "),
    })
  }
  for (const file of visible) {
    const [segment, child, deeper] = file.slug!.split("/")
    const section = sections.get(segment)
    if (section && child === "index" && !deeper && file.frontmatter?.title !== "index") {
      section.title = file.frontmatter?.title ?? section.title
    }
  }
  const result = [...sections.values()].sort((a, b) =>
    a.segment.localeCompare(b.segment, "ko", { numeric: true }),
  )
  navigation.set(allFiles, result)
  return result
}
