import { FullSlug, resolveRelative, simplifySlug } from "../../util/path"
import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../../components/types"

type MenuItem = {
  key: string
  slug: FullSlug
  label: string
  isFolder: boolean
  rank: number
}

function getSlugSegments(slug: FullSlug): string[] {
  const simpleSlug = simplifySlug(slug)

  if (simpleSlug === "/" || simpleSlug.length === 0) {
    return []
  }

  return simpleSlug.split("/")
}

function getTopLevelSegment(slug: FullSlug): string | undefined {
  return getSlugSegments(slug)[0]
}

function formatMenuLabel(label: string): string {
  const normalized = label
    .replace(/^\d+[-_\s]*/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  return normalized.length > 0 ? normalized : label
}

function getItemRank(rawSlug: string, segments: string[]) {
  const isFolderIndex = rawSlug.endsWith("/index")
  const isRootFile = segments.length === 1 && !isFolderIndex

  if (isFolderIndex) return 0
  if (isRootFile) return 1
  return 2
}

const HeaderMenu: QuartzComponent = ({ allFiles, fileData }: QuartzComponentProps) => {
  if (allFiles.length === 0 || !fileData.slug) {
    return null
  }

  const currentTopLevel = getTopLevelSegment(fileData.slug)
  const itemsByKey = new Map<string, MenuItem>()

  for (const file of allFiles) {
    if (!file.slug) continue

    const rawSlug = file.slug
    const segments = getSlugSegments(rawSlug)
    const key = segments[0]

    if (!key || key === "tags" || key === "404") continue

    const rank = getItemRank(rawSlug, segments)
    const isFolder = rank !== 1
    const existing = itemsByKey.get(key)

    if (existing && existing.rank <= rank) continue

    itemsByKey.set(key, {
      key,
      slug: isFolder ? (`${key}/index` as FullSlug) : rawSlug,
      label: formatMenuLabel(file.frontmatter?.title ?? key),
      isFolder,
      rank,
    })
  }

  const items = [...itemsByKey.values()].sort((a, b) => {
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1

    return a.label.localeCompare(b.label, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  })

  if (items.length === 0) {
    return null
  }

  return (
    <nav class="header-menu" aria-label="Top level sections">
      <ul class="header-menu-list">
        {items.map((item) => {
          const topLevel = getTopLevelSegment(item.slug)
          const isActive = topLevel !== undefined && topLevel === currentTopLevel

          return (
            <li class="header-menu-item">
              <a
                class={isActive ? "active" : undefined}
                href={resolveRelative(fileData.slug!, item.slug)}
              >
                {item.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

HeaderMenu.css = `
.header-menu {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.header-menu-list {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem 0.95rem;
  list-style: none;
  margin: 0;
  padding: 0;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}

.header-menu-list::-webkit-scrollbar {
  display: none;
}

.header-menu-item {
  flex: 0 0 auto;
}

.header-menu-item > a {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0;
  color: var(--darkgray);
  font-family: var(--headerFont);
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0.78;
}

.header-menu-item > a.active {
  color: var(--dark);
  opacity: 1;
}

.header-menu-item > a.active::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.55rem;
  height: 2px;
  background: linear-gradient(90deg, var(--secondary), var(--tertiary));
  border-radius: 999px;
}

@media all and (max-width: 800px) {
  .header-menu {
    overflow-x: auto;
  }

  .header-menu-list {
    justify-content: flex-start;
  }
}
`

export default (() => HeaderMenu) satisfies QuartzComponentConstructor
