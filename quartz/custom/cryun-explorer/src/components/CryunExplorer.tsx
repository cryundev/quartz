import { i18n } from "../../../../i18n"
import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../../../../components/types"

interface FileTrieNode {
  slugSegment?: string
  displayName?: string
  isFolder: boolean
  children: FileTrieNode[]
}

export interface CryunExplorerOptions {
  title?: string
  folderDefaultState: "collapsed" | "open"
  folderClickBehavior: "collapse" | "link"
  useSavedState: boolean
  sortFn?: (a: FileTrieNode, b: FileTrieNode) => number
  filterFn?: (node: FileTrieNode) => boolean
  mapFn?: (node: FileTrieNode) => FileTrieNode
  order?: Array<"filter" | "map" | "sort">
}

const defaultOptions: CryunExplorerOptions = {
  folderDefaultState: "collapsed",
  folderClickBehavior: "link",
  useSavedState: true,
  mapFn: (node) => node,
  sortFn: (a, b) => {
    if ((!a.isFolder && !b.isFolder) || (a.isFolder && b.isFolder)) {
      return (a.displayName || "").localeCompare(b.displayName || "", undefined, {
        numeric: true,
        sensitivity: "base",
      })
    }

    return a.isFolder ? -1 : 1
  },
  filterFn: (node) => node.slugSegment !== "tags",
  order: ["filter", "map", "sort"],
}

let numExplorers = 0

const explorerScript = `
class FileTrieNode {
  constructor(segments, data) {
    this.children = []
    this.slugSegments = segments
    this.data = data || null
    this.isFolder = false
    this.fileSegmentHint = null
    this.displayNameOverride = undefined
  }

  get displayName() {
    if (this.displayNameOverride !== undefined) return this.displayNameOverride
    const nonIndexTitle = this.data?.title === "index" ? undefined : this.data?.title
    return nonIndexTitle || this.fileSegmentHint || this.slugSegment || ""
  }

  set displayName(name) {
    this.displayNameOverride = name
  }

  get slug() {
    const path = this.slugSegments.join("/")
    return this.isFolder ? path + "/index" : path
  }

  get slugSegment() {
    return this.slugSegments[this.slugSegments.length - 1] || ""
  }

  makeChild(path, file) {
    const fullPath = [...this.slugSegments, path[0]]
    const child = new FileTrieNode(fullPath, file)
    this.children.push(child)
    return child
  }

  insert(path, file) {
    if (path.length === 0) return
    this.isFolder = true
    const segment = path[0]
    if (path.length === 1) {
      if (segment === "index") {
        this.data = file
      } else {
        this.makeChild(path, file)
      }
      return
    }

    let child = this.children.find((candidate) => candidate.slugSegment === segment)
    if (!child) {
      child = this.makeChild(path, undefined)
    }
    const fileParts = (file.filePath || file.slug || "").split("/")
    child.fileSegmentHint = fileParts[fileParts.length - path.length]
    child.insert(path.slice(1), file)
  }

  add(file) {
    this.insert(file.slug.split("/"), file)
  }

  sort(sortFn) {
    this.children.sort(sortFn)
    this.children.forEach((child) => child.sort(sortFn))
  }

  filter(filterFn) {
    this.children = this.children.filter(filterFn)
    this.children.forEach((child) => child.filter(filterFn))
  }

  map(mapFn) {
    mapFn(this)
    this.children.forEach((child) => child.map(mapFn))
  }

  findNode(path) {
    if (path.length === 0 || (path.length === 1 && path[0] === "index")) return this
    return this.children.find((child) => child.slugSegment === path[0])?.findNode(path.slice(1))
  }

  static fromEntries(entries) {
    const trie = new FileTrieNode([], null)
    entries.forEach(([slug, entry]) => trie.add({ slug, ...entry }))
    return trie
  }
}

const defaultSortFn = (a, b) => {
  if ((!a.isFolder && !b.isFolder) || (a.isFolder && b.isFolder)) {
    return a.displayName.localeCompare(b.displayName, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  }
  return a.isFolder ? -1 : 1
}

const defaultFilterFn = (node) => node.slugSegment !== "tags"

function simplifySlug(slug) {
  let simple = String(slug || "").replace(/^\\/+|\\/+$/g, "")
  if (simple === "index") return ""
  if (simple.endsWith("/index")) simple = simple.slice(0, -"/index".length)
  return simple
}

function hrefForSlug(slug) {
  const basePath = document.body.dataset.basepath || ""
  const simple = simplifySlug(slug)
  const path = [basePath.replace(/\\/+$/g, ""), simple].filter(Boolean).join("/")
  return "/" + path.replace(/^\\/+|\\/+$/g, "")
}

function processTrie(trie, dataFns) {
  let sortFn = defaultSortFn
  let filterFn = defaultFilterFn
  let mapFn = null

  if (dataFns) {
    try {
      const parsed = JSON.parse(dataFns)
      if (parsed.sortFn) sortFn = new Function("a", "b", "return (" + parsed.sortFn + ")(a, b)")
      if (parsed.filterFn) filterFn = new Function("node", "return (" + parsed.filterFn + ")(node)")
      if (parsed.mapFn) mapFn = new Function("node", "return (" + parsed.mapFn + ")(node)")
      const order = parsed.order || ["filter", "map", "sort"]
      for (const step of order) {
        if (step === "filter" && filterFn) trie.filter(filterFn)
        if (step === "map" && mapFn) trie.map(mapFn)
        if (step === "sort" && sortFn) trie.sort(sortFn)
      }
      return trie
    } catch (error) {
      console.error("Error parsing explorer functions:", error)
    }
  }

  trie.filter(filterFn)
  trie.sort(sortFn)
  return trie
}

async function buildFileTrie(dataFns) {
  try {
    const data = await fetchData
    const contentData = data.content || data
    const entries = Object.entries(contentData)
    if (entries.length === 0) return null
    return processTrie(FileTrieNode.fromEntries(entries), dataFns)
  } catch (error) {
    console.error("Error building file trie:", error)
    return null
  }
}

function getCurrentFolderSegments(currentSlug) {
  const simple = simplifySlug(currentSlug)
  if (simple.length === 0) return []
  const segments = simple.split("/").filter(Boolean)
  if (String(currentSlug || "").endsWith("/index")) return segments
  return segments.slice(0, -1)
}

function createLinkNode(node, currentSlug, className) {
  const li = document.createElement("li")
  const link = document.createElement("a")
  link.href = hrefForSlug(node.slug)
  link.textContent = node.displayName || node.slugSegment
  link.className = className || "nav-file-title tree-item-self"
  if (node.data?.slug === currentSlug || node.slug === currentSlug) {
    link.classList.add("active", "is-active")
  }
  li.appendChild(link)
  return li
}

function createParentNode(explorer, currentSlug, folderSegments) {
  const li = document.createElement("li")
  li.className = "explorer-parent-item"
  const link = document.createElement("a")
  link.className = "explorer-parent"
  link.textContent = ".."

  const parentLabel = explorer.dataset.parentLabel || "Up One Level"
  const rootLabel = explorer.dataset.rootLabel || "Top Level"

  if (folderSegments.length === 0) {
    link.title = rootLabel
    link.classList.add("is-disabled")
    link.setAttribute("aria-disabled", "true")
  } else {
    const parentSegments = folderSegments.slice(0, -1)
    const parentSlug = parentSegments.length === 0 ? "index" : parentSegments.join("/") + "/index"
    link.title = parentLabel
    link.href = hrefForSlug(parentSlug)
    link.setAttribute("aria-disabled", "false")
  }

  li.appendChild(link)
  return li
}

let currentRenderGeneration = 0

async function setupExplorer(event) {
  const thisGeneration = ++currentRenderGeneration
  const eventSlug = event?.detail?.url
  const currentSlug = eventSlug || document.body.dataset.slug || "index"
  const allExplorers = document.querySelectorAll("div.explorer")

  for (const explorer of allExplorers) {
    const explorerUl = explorer.querySelector(".explorer-ul")
    if (!explorerUl) continue

    const trie = await buildFileTrie(explorer.dataset.dataFns)
    if (thisGeneration !== currentRenderGeneration || !trie) continue

    const currentFolderSegments = getCurrentFolderSegments(currentSlug)
    const visibleRoot = trie.findNode(currentFolderSegments) || trie

    explorerUl.replaceChildren()
    explorerUl.appendChild(createParentNode(explorer, currentSlug, currentFolderSegments))
    for (const child of visibleRoot.children) {
      explorerUl.appendChild(
        child.isFolder
          ? createLinkNode(child, currentSlug, "nav-file-title tree-item-self folder-link")
          : createLinkNode(child, currentSlug),
      )
    }
    const end = document.createElement("li")
    end.className = "overflow-end"
    explorerUl.appendChild(end)

    const scrollTop = sessionStorage.getItem("explorerScrollTop")
    if (scrollTop) {
      explorerUl.scrollTop = parseInt(scrollTop, 10)
    } else {
      explorerUl.querySelector(".active")?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }

    const cleanupHandlers = []
    for (const button of explorer.getElementsByClassName("explorer-toggle")) {
      const clickHandler = function () {
        const nearestExplorer = this.closest(".explorer")
        if (!nearestExplorer) return
        nearestExplorer.classList.toggle("collapsed")
        nearestExplorer.setAttribute(
          "aria-expanded",
          nearestExplorer.getAttribute("aria-expanded") === "true" ? "false" : "true",
        )
      }
      button.addEventListener("click", clickHandler)
      cleanupHandlers.push(() => button.removeEventListener("click", clickHandler))
    }

    const scrollContainer = explorer.querySelector(".explorer-ul")
    if (scrollContainer) {
      const scrollHandler = () => sessionStorage.setItem("explorerScrollTop", scrollContainer.scrollTop)
      scrollContainer.addEventListener("scroll", scrollHandler)
      cleanupHandlers.push(() => scrollContainer.removeEventListener("scroll", scrollHandler))
    }

    window.addCleanup?.(() => cleanupHandlers.forEach((cleanup) => cleanup()))
  }
}

document.addEventListener("nav", setupExplorer)
document.addEventListener("render", setupExplorer)
`

const explorerStyle = `
@media all and (max-width: 800px) {
  .explorer .hide-until-loaded ~ .explorer-content {
    display: none;
  }
}

.explorer {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  min-height: 0;
}

.explorer.collapsed .fold {
  transform: rotateZ(-90deg);
}

.explorer .fold {
  margin-left: 0.5rem;
  transition: transform 0.3s ease;
  opacity: 0.8;
}

.explorer button.mobile-explorer {
  display: none;
}

.explorer button.desktop-explorer {
  display: flex;
}

@media all and (max-width: 800px) {
  .explorer {
    order: -1;
    height: initial;
    overflow: hidden;
    flex-shrink: 0;
    align-self: stretch;
    width: 100%;
    margin-top: 0;
    margin-bottom: 0;
  }

  .explorer button.mobile-explorer {
    display: flex;
  }

  .explorer button.desktop-explorer {
    display: none;
  }
}

.explorer svg {
  pointer-events: all;
  transition: transform 0.35s ease;
}

button.mobile-explorer,
button.desktop-explorer {
  background-color: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  padding: 0;
  color: var(--dark);
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

button.mobile-explorer h2,
button.desktop-explorer h2 {
  font-size: 1rem;
  display: inline-block;
  margin: 0;
}

.explorer-content {
  list-style: none;
  overflow: visible;
  margin-top: 0.9rem;
}

.explorer-content ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.explorer-content ul.explorer-ul {
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.explorer-content ul li > a {
  color: var(--dark);
  opacity: 0.88;
  pointer-events: all;
  display: block;
  width: 100%;
  padding: 0.7rem 0.8rem;
  border-radius: 0.95rem;
  background: color-mix(in srgb, var(--light) 62%, white);
  border: 1px solid color-mix(in srgb, var(--lightgray) 70%, var(--secondary) 8%);
  box-sizing: border-box;
  transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
}

.explorer-content ul li > a.active {
  opacity: 1;
  color: var(--secondary);
  border-color: color-mix(in srgb, var(--secondary) 30%, var(--lightgray));
  background: color-mix(in srgb, var(--secondary) 8%, white);
}

.explorer-content ul li > a:hover {
  color: var(--secondary);
  border-color: color-mix(in srgb, var(--secondary) 20%, var(--lightgray));
}

.explorer.collapsed .explorer-content {
  display: none;
}

.explorer-parent-item {
  margin-bottom: 0.1rem;
}

.explorer-content .folder-link,
.explorer-content .explorer-parent {
  position: relative;
  display: block;
  width: 100%;
  padding-left: 1.75rem;
  font-family: var(--headerFont);
  font-weight: 600;
  color: var(--secondary);
  box-sizing: border-box;
}

.explorer-content .folder-link::before,
.explorer-content .explorer-parent::before {
  content: "";
  position: absolute;
  left: 0.8rem;
  top: 50%;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 2px;
  background: color-mix(in srgb, var(--secondary) 75%, var(--light));
  transform: translateY(-50%);
}

.explorer-content .explorer-parent.is-disabled {
  color: var(--gray);
  pointer-events: none;
  opacity: 0.6;
}

:root[saved-theme="dark"] .explorer-content ul li > a {
  background: color-mix(in srgb, var(--page-surface) 84%, #36383a);
  border-color: color-mix(in srgb, var(--page-border) 88%, transparent);
}

:root[saved-theme="dark"] .explorer-content ul li > a.active {
  color: var(--dark);
  border-color: color-mix(in srgb, var(--page-border) 72%, var(--secondary) 10%);
  background: color-mix(in srgb, var(--highlight) 18%, var(--page-surface) 82%);
}

@media all and (max-width: 800px) {
  .explorer .explorer-content {
    position: static;
    inset: auto;
    display: block;
    margin-top: 0.9rem;
    background-color: transparent;
    max-width: none;
    min-width: 0;
    width: 100%;
    transform: none;
    transition: none;
    overflow: visible;
    padding: 0;
    height: auto;
    max-height: none;
    visibility: visible;
  }

  .explorer .explorer-content > .explorer-ul {
    max-height: none;
    overflow: visible;
    padding-bottom: 0;
  }

  .explorer .mobile-explorer {
    margin: 0;
    padding: 0;
  }
}
`

export default ((userOpts?: Partial<CryunExplorerOptions>) => {
  const opts: CryunExplorerOptions = { ...defaultOptions, ...userOpts }

  const CryunExplorer: QuartzComponent = ({ cfg, displayClass }: QuartzComponentProps) => {
    const id = `cryun-explorer-${numExplorers++}`
    const locale = cfg.locale ?? "en-US"
    const title = opts.title ?? i18n(locale).components.explorer.title

    return (
      <div
        class={[displayClass, "explorer", "nav-files-container"].filter(Boolean).join(" ")}
        data-behavior={opts.folderClickBehavior}
        data-collapsed={opts.folderDefaultState}
        data-savestate={opts.useSavedState}
        data-parent-label={locale.startsWith("ko") ? "상위 폴더" : "Up One Level"}
        data-root-label={locale.startsWith("ko") ? "최상위 폴더" : "Top Level"}
        data-data-fns={JSON.stringify({
          order: opts.order,
          sortFn: opts.sortFn?.toString(),
          filterFn: opts.filterFn?.toString(),
          mapFn: opts.mapFn?.toString(),
        })}
      >
        <button
          type="button"
          class="explorer-toggle mobile-explorer hide-until-loaded"
          data-mobile={true}
          aria-controls={id}
          aria-label={title}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide-menu"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>
        <button
          type="button"
          class="title-button explorer-toggle desktop-explorer"
          data-mobile={false}
          aria-expanded={true}
        >
          <h2>{title}</h2>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="5 8 14 8"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="fold"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <div id={id} class="explorer-content" aria-expanded={false} role="group">
          <ul class="explorer-ul overflow">
            <li class="explorer-parent-item">
              <a
                class="explorer-parent is-disabled"
                aria-disabled={true}
                title={locale.startsWith("ko") ? "최상위 폴더" : "Top Level"}
              >
                ..
              </a>
            </li>
            <li class="overflow-end" />
          </ul>
        </div>
      </div>
    )
  }

  CryunExplorer.css = explorerStyle
  CryunExplorer.afterDOMLoaded = explorerScript
  return CryunExplorer
}) satisfies QuartzComponentConstructor
