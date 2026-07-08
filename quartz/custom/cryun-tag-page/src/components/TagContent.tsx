import { Root } from "hast"
import { ComponentChildren } from "preact"
import { i18n } from "../../../../i18n"
import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../../../../components/types"
import { QuartzPluginData } from "../../../../plugins/vfile"
import {
  FilePath,
  FullSlug,
  getAllSegmentPrefixes,
  resolveRelative,
  simplifySlug,
} from "../../../../util/path"
import { htmlToJsx } from "../../../../util/jsx"
import { PageList, SortFn, pageListStyle } from "../../../shared/PageList"

interface TagContentOptions {
  sort?: SortFn
  numPages: number
}

const defaultOptions: TagContentOptions = {
  numPages: 10,
}

type PageFileData = QuartzPluginData & {
  unlisted?: boolean
}

function isListed(file: PageFileData): boolean {
  return file.unlisted !== true
}

export default ((opts?: Partial<TagContentOptions>) => {
  const options: TagContentOptions = { ...defaultOptions, ...opts }

  const TagContent: QuartzComponent = (props: QuartzComponentProps) => {
    const { tree, fileData, allFiles, cfg } = props
    const slug = fileData.slug
    if (!(slug?.startsWith("tags/") || slug === "tags")) {
      throw new Error(`Component "CryunTagContent" tried to render a non-tag page: ${slug}`)
    }

    const tag = simplifySlug(slug.slice("tags/".length) as FullSlug)
    const locale = cfg.locale
    const allPagesWithTag = (targetTag: string) =>
      (allFiles as PageFileData[])
        .filter(isListed)
        .filter((file) =>
          (file.frontmatter?.tags ?? []).flatMap(getAllSegmentPrefixes).includes(targetTag),
        )

    const hastRoot = tree as Root
    const content =
      hastRoot.children.length === 0
        ? fileData.description
        : htmlToJsx(fileData.filePath ?? ("content/tags/index.md" as FilePath), hastRoot)

    const classes = (fileData.frontmatter?.cssclasses ?? []).join(" ")

    if (tag === "/") {
      const tags = [
        ...new Set(
          (allFiles as PageFileData[])
            .filter(isListed)
            .flatMap((data) => data.frontmatter?.tags ?? [])
            .flatMap(getAllSegmentPrefixes),
        ),
      ].sort((a, b) => a.localeCompare(b))

      const tagItemMap = new Map<string, PageFileData[]>()
      for (const currentTag of tags) {
        tagItemMap.set(currentTag, allPagesWithTag(currentTag))
      }

      return (
        <div class="popover-hint tag-content-view">
          <article class={classes}>
            <div class="markdown-preview-view markdown-rendered">
              <p>{content}</p>
            </div>
          </article>
          <p class="tag-summary">
            {i18n(locale).pages.tagContent.totalTags({ count: tags.length })}
          </p>
          <div class="tag-sections">
            {tags.map((currentTag) => {
              const pages = tagItemMap.get(currentTag)!
              const listProps = {
                ...props,
                allFiles: pages,
              }
              const pageListContent = PageList({
                ...listProps,
                limit: options.numPages,
                sort: options.sort,
              }) as ComponentChildren

              const contentPage = (allFiles as PageFileData[]).find(
                (file) => file.slug === `tags/${currentTag}`,
              )
              const root = contentPage?.filePath ? contentPage.htmlAst : undefined
              const tagDesc =
                !root || root.children.length === 0
                  ? contentPage?.description
                  : htmlToJsx(contentPage!.filePath!, root)

              const tagListingPage = `/tags/${currentTag}` as FullSlug
              const href = resolveRelative(slug, tagListingPage)

              return (
                <section class="tag-section">
                  <h2>
                    <a class="internal tag-link" href={href}>
                      {currentTag}
                    </a>
                  </h2>
                  {tagDesc && <p>{tagDesc}</p>}
                  <div class="page-listing">
                    <p>
                      {i18n(locale).pages.tagContent.itemsUnderTag({ count: pages.length })}
                      {pages.length > options.numPages && (
                        <>
                          {" "}
                          <span>
                            {i18n(locale).pages.tagContent.showingFirst({
                              count: options.numPages,
                            })}
                          </span>
                        </>
                      )}
                    </p>
                    {pageListContent}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      )
    }

    const pages = allPagesWithTag(tag)
    const listProps = {
      ...props,
      allFiles: pages,
    }
    const pageListContent = PageList({
      ...listProps,
      sort: options.sort,
    }) as ComponentChildren

    return (
      <div class="popover-hint tag-content-view">
        <article class={classes}>
          <div class="markdown-preview-view markdown-rendered">{content}</div>
        </article>
        <div class="page-listing">
          <p>{i18n(locale).pages.tagContent.itemsUnderTag({ count: pages.length })}</p>
          <div>{pageListContent}</div>
        </div>
      </div>
    )
  }

  TagContent.css = pageListStyle
  return TagContent
}) satisfies QuartzComponentConstructor
