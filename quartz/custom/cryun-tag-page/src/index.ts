import { i18n } from "../../../i18n"
import { FullSlug, getAllSegmentPrefixes, joinSegments } from "../../../util/path"
import { PageMatcher, QuartzPageTypePlugin, VirtualPage } from "../../../plugins/types"
import TagContentComponent from "./components/TagContent"
import { SortFn } from "../../shared/PageList"

export interface CryunTagPageOptions {
  sort?: SortFn
  numPages?: number
  prefixTags?: boolean
}

const tagMatcher: PageMatcher = ({ slug }) => {
  return slug.startsWith("tags/") || slug === "tags"
}

export const CryunTagPage: QuartzPageTypePlugin<CryunTagPageOptions> = (opts) => ({
  name: "CryunTagPage",
  priority: 10,
  match: tagMatcher,
  generate({ content, cfg }) {
    const allFiles = content.map((c) => c[1].data).filter((d) => d.unlisted !== true)
    const locale = cfg.locale ?? "en-US"

    const tags = new Set(
      allFiles.flatMap((data) => data.frontmatter?.tags ?? []).flatMap(getAllSegmentPrefixes),
    )
    tags.add("index")

    const existingTagSlugs = new Set<string>()
    for (const [, file] of content) {
      const slug = file.data.slug
      if (slug?.startsWith("tags/")) {
        existingTagSlugs.add(slug)
      }
    }

    const virtualPages: VirtualPage[] = []
    for (const tag of tags) {
      const slug = joinSegments("tags", tag) as FullSlug
      if (existingTagSlugs.has(slug)) continue

      const title =
        tag === "index"
          ? i18n(locale).pages.tagContent.tagIndex
          : opts?.prefixTags
            ? `${i18n(locale).pages.tagContent.tag}: ${tag}`
            : tag

      virtualPages.push({
        slug,
        title,
        data: {},
      })
    }

    return virtualPages
  },
  layout: "tag",
  body: TagContentComponent,
})

export default CryunTagPage
