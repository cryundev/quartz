import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { BuildTimeTrieData, trieFromAllFiles } from "../util/ctx"
import { FileTrieNode } from "../util/fileTrie"
import { FullSlug, resolveRelative, simplifySlug } from "../util/path"
import style from "./styles/headerMenu.scss"

function sortRootItems(a: FileTrieNode<BuildTimeTrieData>, b: FileTrieNode<BuildTimeTrieData>) {
  if ((!a.isFolder && !b.isFolder) || (a.isFolder && b.isFolder)) {
    return a.displayName.localeCompare(b.displayName, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  }

  return a.isFolder ? -1 : 1
}

function getTopLevelSegment(slug: FullSlug): string | undefined {
  const simpleSlug = simplifySlug(slug)
  if (simpleSlug === "/") {
    return undefined
  }

  return simpleSlug.split("/")[0]
}

function formatMenuLabel(label: string): string {
  const normalized = label
    .replace(/^\d+[-_\s]*/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  return normalized.length > 0 ? normalized : label
}

const HeaderMenu: QuartzComponent = ({ allFiles, fileData }: QuartzComponentProps) => {
  if (allFiles.length === 0 || !fileData.slug) {
    return null
  }

  const trie = trieFromAllFiles(allFiles)
  trie.filter((node) => node.slugSegment !== "tags")
  trie.sort(sortRootItems)

  const currentTopLevel = getTopLevelSegment(fileData.slug)
  const items = trie.children

  if (items.length === 0) {
    return null
  }

  return (
    <nav class="header-menu" aria-label="Top level sections">
      <ul class="header-menu-list">
        {items.map((node) => {
          const topLevel = getTopLevelSegment(node.slug)
          const isActive = topLevel !== undefined && topLevel === currentTopLevel

          return (
            <li class="header-menu-item">
              <a
                class={isActive ? "active" : undefined}
                href={resolveRelative(fileData.slug!, node.slug)}
              >
                {formatMenuLabel(node.displayName)}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

HeaderMenu.css = style

export default (() => HeaderMenu) satisfies QuartzComponentConstructor
