import { Root } from "hast"
import { ComponentChildren } from "preact"
import { i18n } from "../../../../i18n"
import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../../../../components/types"
import { QuartzPluginData } from "../../../../plugins/vfile"
import { FullSlug, FilePath } from "../../../../util/path"
import { htmlToJsx } from "../../../../util/jsx"
import { FolderCardPreview, PageList, SortFn, pageListStyle } from "../../../shared/PageList"

interface FolderContentOptions {
  showFolderCount: boolean
  showSubfolders: boolean
  sort?: SortFn
}

const defaultOptions: FolderContentOptions = {
  showFolderCount: true,
  showSubfolders: true,
}

interface TrieNode {
  isFolder: boolean
  children: TrieNode[]
  data: (QuartzPluginData & Record<string, unknown>) | null
  slug: FullSlug
  displayName: string
  findNode(path: string[]): TrieNode | undefined
}

type PageEntry = QuartzPluginData & {
  folderCardPreview?: FolderCardPreview
  unlisted?: boolean
}

function mostRecentDatesFromEntries(entries: PageEntry[]): PageEntry["dates"] {
  let maybeDates: PageEntry["dates"] | undefined
  for (const entry of entries) {
    if (!entry.dates) continue
    if (!maybeDates) {
      maybeDates = { ...entry.dates }
      continue
    }

    if (entry.dates.created > maybeDates.created) maybeDates.created = entry.dates.created
    if (entry.dates.modified > maybeDates.modified) maybeDates.modified = entry.dates.modified
    if (entry.dates.published > maybeDates.published) maybeDates.published = entry.dates.published
  }

  return maybeDates ?? { created: new Date(), modified: new Date(), published: new Date() }
}

function mostRecentDatesFromChildren(children: TrieNode[]): PageEntry["dates"] {
  return mostRecentDatesFromEntries(
    children.flatMap((child) => (child.data ? [child.data as PageEntry] : [])),
  )
}

function buildFolderCardPreview(node: TrieNode): FolderCardPreview {
  const items = [...node.children]
    .sort((a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1
      return a.displayName.localeCompare(b.displayName, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    })
    .slice(0, 4)
    .map((child) => ({
      title: child.displayName,
      slug: child.slug,
      isFolder: child.isFolder,
    }))

  return {
    items,
    remainingCount: Math.max(node.children.length - items.length, 0),
  }
}

function pagesFromTrie(folder: TrieNode, showSubfolders: boolean): PageEntry[] {
  return folder.children
    .map((node) => {
      const nodeData = node.data as PageEntry | null
      if (nodeData) {
        if (nodeData.unlisted === true) return undefined
        if (node.isFolder) {
          if (!showSubfolders) return undefined
          return {
            ...nodeData,
            folderCardPreview: buildFolderCardPreview(node),
          }
        }
        return nodeData
      }

      if (node.isFolder && showSubfolders) {
        return {
          slug: node.slug,
          dates: mostRecentDatesFromChildren(node.children),
          frontmatter: { title: node.displayName, tags: [] },
          folderCardPreview: buildFolderCardPreview(node),
        } as PageEntry
      }

      return undefined
    })
    .filter((page): page is PageEntry => page !== undefined)
}

export function pagesFromAllFiles(
  allFiles: QuartzPluginData[],
  folderSlug: string,
  showSubfolders: boolean,
): PageEntry[] {
  const folderPrefix = folderSlug.endsWith("/index")
    ? folderSlug.slice(0, -"index".length)
    : folderSlug.endsWith("/")
      ? folderSlug
      : `${folderSlug}/`

  const directChildren: PageEntry[] = []
  const subfolderFiles = new Map<string, PageEntry[]>()

  for (const file of allFiles as PageEntry[]) {
    if (file.unlisted === true) continue
    const fileSlug = file.slug
    if (!fileSlug || !fileSlug.startsWith(folderPrefix)) continue

    const relativePath = fileSlug.slice(folderPrefix.length)
    if (!relativePath || relativePath === "index") continue

    const segments = relativePath.split("/")
    if (segments.length === 1) {
      directChildren.push(file)
    } else if (showSubfolders) {
      const subfolderName = segments[0]!
      const pages = subfolderFiles.get(subfolderName) ?? []
      pages.push(file)
      subfolderFiles.set(subfolderName, pages)
    }
  }

  for (const [subfolderName, files] of subfolderFiles) {
    const indexFile = files.find((f) => f.slug === `${folderPrefix}${subfolderName}/index`)
    if (indexFile) continue

    const folderPreview = {
      items: files.slice(0, 4).map((file) => ({
        title: file.frontmatter?.title ?? file.slug ?? subfolderName,
        slug: file.slug!,
        isFolder: false,
      })),
      remainingCount: Math.max(files.length - 4, 0),
    }

    directChildren.push({
      slug: `${folderPrefix}${subfolderName}/index` as FullSlug,
      dates: mostRecentDatesFromEntries(files),
      frontmatter: { title: subfolderName, tags: [] },
      folderCardPreview: folderPreview,
    })
  }

  return directChildren
}

export default ((opts?: Partial<FolderContentOptions>) => {
  const options: FolderContentOptions = { ...defaultOptions, ...opts }

  const FolderContent: QuartzComponent = (props: QuartzComponentProps) => {
    const { tree, fileData, allFiles, cfg } = props
    const slug = fileData.slug
    if (!slug) return null

    const trie = props.ctx.trie as TrieNode | undefined
    let allPagesInFolder: PageEntry[]

    if (trie) {
      const folder = trie.findNode(slug.split("/"))
      if (!folder) return null
      allPagesInFolder = pagesFromTrie(folder, options.showSubfolders)
    } else {
      allPagesInFolder = pagesFromAllFiles(allFiles, slug, options.showSubfolders)
    }

    const classes = (fileData.frontmatter?.cssclasses ?? []).join(" ")
    const listProps = {
      ...props,
      sort: options.sort,
      allFiles: allPagesInFolder,
    }

    const hastRoot = tree as Root
    const content =
      hastRoot.children.length === 0
        ? fileData.description
        : htmlToJsx(fileData.filePath ?? ("content/index.md" as FilePath), hastRoot)

    const pageListContent = PageList(listProps) as ComponentChildren

    return (
      <div class="popover-hint folder-content-view">
        <article class={classes}>
          <div class="markdown-preview-view markdown-rendered">{content}</div>
        </article>
        <div class="page-listing">
          {options.showFolderCount && (
            <p>
              {i18n(cfg.locale).pages.folderContent.itemsUnderFolder({
                count: allPagesInFolder.length,
              })}
            </p>
          )}
          <div>{pageListContent}</div>
        </div>
      </div>
    )
  }

  FolderContent.css = pageListStyle
  return FolderContent
}) satisfies QuartzComponentConstructor
