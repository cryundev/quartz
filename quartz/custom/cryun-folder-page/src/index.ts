import path from "path"
import { PageMatcher, QuartzPageTypePlugin, VirtualPage } from "../../../plugins/types"
import { QuartzComponentConstructor } from "../../../components/types"
import { i18n } from "../../../i18n"
import { FullSlug, joinSegments } from "../../../util/path"
import FolderContentComponent from "./components/FolderContent"
import { SortFn } from "../../shared/PageList"

export interface CryunFolderPageOptions {
  showFolderCount?: boolean
  showSubfolders?: boolean
  sort?: SortFn
  prefixFolders?: boolean
}

const folderMatcher: PageMatcher = ({ slug }) => {
  return slug.endsWith("/index")
}

function getFolders(slug: string): string[] {
  let folderName = path.dirname(slug ?? "")
  const parentFolderNames = [folderName]
  while (folderName !== ".") {
    folderName = path.dirname(folderName ?? "")
    parentFolderNames.push(folderName)
  }
  return parentFolderNames
}

export const CryunFolderPage: QuartzPageTypePlugin<CryunFolderPageOptions> = (opts) => {
  const body: QuartzComponentConstructor = () => FolderContentComponent(opts)

  return {
    name: "CryunFolderPage",
    priority: 10,
    match: folderMatcher,
    generate({ content, cfg }) {
      const allFiles = content.map((c) => c[1].data).filter((d) => d.unlisted !== true)
      const locale = cfg.locale ?? "en-US"

      const folders = new Set<string>()
      const folderDisplayNames = new Map<string, string>()
      for (const file of allFiles) {
        const slug = file.slug
        if (!slug) continue
        const fileFolders = getFolders(slug).filter((f) => f !== "." && f !== "tags")
        for (const folder of fileFolders) {
          folders.add(folder)
        }

        const relativePath = file.relativePath
        if (relativePath) {
          const slugParts = path.dirname(slug).split("/").filter(Boolean)
          const pathParts = path.dirname(relativePath).split("/").filter(Boolean)
          for (let i = 0; i < slugParts.length && i < pathParts.length; i++) {
            const slugPart = slugParts[i]
            const pathPart = pathParts[i]
            if (slugPart && pathPart && !folderDisplayNames.has(slugPart)) {
              folderDisplayNames.set(slugPart, pathPart)
            }
          }
        }
      }

      const foldersWithIndex = new Set<string>()
      for (const [, file] of content) {
        if (file.data.unlisted === true) continue
        const slug = file.data.slug
        if (slug?.endsWith("/index")) {
          foldersWithIndex.add(slug.slice(0, -"/index".length))
        }
      }

      for (const [, file] of content) {
        const slug = file.data.slug
        if (!slug?.endsWith("/index")) continue

        const frontmatter = file.data.frontmatter
        if (!frontmatter || (frontmatter.title && frontmatter.title !== "index")) continue

        const folder = slug.slice(0, -"/index".length)
        const slugSegment = folder.split("/").pop() ?? folder
        const folderName = folderDisplayNames.get(slugSegment) ?? slugSegment
        frontmatter.title = opts?.prefixFolders
          ? `${i18n(locale).pages.folderContent.folder}: ${folderName}`
          : folderName
      }

      const virtualPages: VirtualPage[] = []
      for (const folder of folders) {
        if (foldersWithIndex.has(folder)) continue

        const slug = joinSegments(folder, "index") as FullSlug
        const slugSegment = folder.split("/").pop() ?? folder
        const folderName = folderDisplayNames.get(slugSegment) ?? slugSegment
        const title = opts?.prefixFolders
          ? `${i18n(locale).pages.folderContent.folder}: ${folderName}`
          : folderName

        virtualPages.push({
          slug,
          title,
          data: {},
        })
      }

      return virtualPages
    },
    layout: "folder",
    body,
  }
}

export default CryunFolderPage
