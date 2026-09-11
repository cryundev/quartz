import { resolveRelative, simplifySlug } from "@quartz-community/utils"
import type { QuartzComponentProps } from "../../../components/types"
import type { BuildTimeTrieData } from "../../../util/ctx"
import type { FileTrieNode } from "../../../util/fileTrie"
import type { FullSlug } from "../../../util/path"

type Node = FileTrieNode<BuildTimeTrieData>

function isVisible(node: Node): boolean {
  if (node.slugSegment === "tags" || node.data?.unlisted === true) return false
  return !node.isFolder || node.data !== null || node.children.some(isVisible)
}

function visibleChildren(node: Node): Node[] {
  return node.children
    .filter(isVisible)
    .sort(
      (a, b) =>
        Number(b.isFolder) - Number(a.isFolder) ||
        a.displayName.localeCompare(b.displayName, "ko", { numeric: true }),
    )
}

export function ExplorerTree({ node, current }: { node: Node; current: FullSlug }) {
  return (
    <ul>
      {visibleChildren(node).map((child) => {
        const active = simplifySlug(child.slug) === simplifySlug(current)
        const path = simplifySlug(child.slug)
        const containsCurrent = active || current.startsWith(path)
        const link = (
          <a
            href={resolveRelative(current, child.slug)}
            title={child.displayName}
            aria-current={active ? "page" : undefined}
          >
            {child.displayName}
          </a>
        )
        return (
          <li>
            {child.isFolder ? (
              <details
                data-folder={child.slug}
                data-current={containsCurrent}
                open={containsCurrent}
              >
                <summary>
                  <span class="cryun-tree-chevron" aria-hidden="true">
                    ›
                  </span>
                  {link}
                </summary>
                <ExplorerTree node={child} current={current} />
              </details>
            ) : (
              link
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function Explorer({ ctx, fileData }: QuartzComponentProps) {
  if (!ctx.trie || !fileData.slug) return null
  return (
    <nav class="cryun-explorer" aria-label="문서 탐색">
      <h2>문서 탐색</h2>
      <div class="cryun-tree">
        <ExplorerTree node={ctx.trie} current={fileData.slug} />
      </div>
    </nav>
  )
}
