import type { QuartzPluginData } from "../../../plugins/vfile"
import type { FullSlug } from "../../../util/path"

export interface LibrarySection {
  slug: FullSlug
  segment: string
  title: string
  notes: QuartzPluginData[]
}

export interface Library {
  sections: LibrarySection[]
  notes: QuartzPluginData[]
}

const libraries = new WeakMap<QuartzPluginData[], Library>()

export function noteDate(note: QuartzPluginData): Date | undefined {
  return note.dates?.modified ?? note.dates?.created
}

export function sectionLabel(segment: string): string {
  return segment.replace(/^\d+[-_\s]+/, "").replace(/[-_]+/g, " ")
}

// allFiles is Quartz's filtered, published input. Derive navigation once per input
// array without mutating the shared trie or adding a second content index.
export function getLibrary(allFiles: QuartzPluginData[]): Library {
  const cached = libraries.get(allFiles)
  if (cached) return cached

  const visible = allFiles.filter(
    (file) => file.slug && file.unlisted !== true && !file.slug.startsWith("tags/"),
  )
  const notes = visible
    .filter(
      (file) =>
        file.filePath?.endsWith(".md") && file.slug !== "index" && !file.slug!.endsWith("/index"),
    )
    .sort(
      (a, b) =>
        (noteDate(b)?.getTime() ?? 0) - (noteDate(a)?.getTime() ?? 0) ||
        (a.frontmatter?.title ?? "").localeCompare(b.frontmatter?.title ?? "", "ko"),
    )
  const sections = new Map<string, LibrarySection>()
  for (const note of notes) {
    const [segment, child] = note.slug!.split("/")
    if (!child) continue
    let section = sections.get(segment)
    if (!section) {
      section = {
        slug: `${segment}/index` as FullSlug,
        segment,
        title: sectionLabel(segment),
        notes: [],
      }
      sections.set(segment, section)
    }
    section.notes.push(note)
  }
  for (const file of visible) {
    const [segment, child, deeper] = file.slug!.split("/")
    if (child !== "index" || deeper) continue
    const section = sections.get(segment)
    if (section && file.frontmatter?.title && file.frontmatter.title !== "index") {
      section.title = file.frontmatter.title
    }
  }
  const library = {
    notes,
    sections: [...sections.values()].sort((a, b) =>
      a.segment.localeCompare(b.segment, "ko", { numeric: true }),
    ),
  }
  libraries.set(allFiles, library)
  return library
}
