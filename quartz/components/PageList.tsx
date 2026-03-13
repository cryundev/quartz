import { FullSlug, isFolderPath, resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { Date, getDate } from "./Date"
import { QuartzComponent, QuartzComponentProps } from "./types"
import { GlobalConfiguration } from "../cfg"
import { i18n } from "../i18n"

export type SortFn = (f1: QuartzPluginData, f2: QuartzPluginData) => number

export function byDateAndAlphabetical(cfg: GlobalConfiguration): SortFn {
  return (f1, f2) => {
    // Sort by date/alphabetical
    if (f1.dates && f2.dates) {
      // sort descending
      return getDate(cfg, f2)!.getTime() - getDate(cfg, f1)!.getTime()
    } else if (f1.dates && !f2.dates) {
      // prioritize files with dates
      return -1
    } else if (!f1.dates && f2.dates) {
      return 1
    }

    // otherwise, sort lexographically by title
    const f1Title = f1.frontmatter?.title.toLowerCase() ?? ""
    const f2Title = f2.frontmatter?.title.toLowerCase() ?? ""
    return f1Title.localeCompare(f2Title)
  }
}

export function byDateAndAlphabeticalFolderFirst(cfg: GlobalConfiguration): SortFn {
  return (f1, f2) => {
    // Sort folders first
    const f1IsFolder = isFolderPath(f1.slug ?? "")
    const f2IsFolder = isFolderPath(f2.slug ?? "")
    if (f1IsFolder && !f2IsFolder) return -1
    if (!f1IsFolder && f2IsFolder) return 1

    // If both are folders or both are files, sort by date/alphabetical
    if (f1.dates && f2.dates) {
      // sort descending
      return getDate(cfg, f2)!.getTime() - getDate(cfg, f1)!.getTime()
    } else if (f1.dates && !f2.dates) {
      // prioritize files with dates
      return -1
    } else if (!f1.dates && f2.dates) {
      return 1
    }

    // otherwise, sort lexographically by title
    const f1Title = f1.frontmatter?.title.toLowerCase() ?? ""
    const f2Title = f2.frontmatter?.title.toLowerCase() ?? ""
    return f1Title.localeCompare(f2Title)
  }
}

type Props = {
  limit?: number
  sort?: SortFn
} & QuartzComponentProps

type FolderCardPreviewItem = {
  title: string
  slug: FullSlug
  isFolder: boolean
}

type FolderCardPreview = {
  items: FolderCardPreviewItem[]
  remainingCount: number
}

function getPageListLabels(locale: string) {
  if (locale.toLowerCase().startsWith("ko")) {
    return {
      folder: "폴더",
      note: "문서",
      updated: "최근 수정",
      more: "개 더",
    }
  }

  return {
    folder: "Folder",
    note: "Note",
    updated: "Updated",
    more: "more",
  }
}

function getFolderCardPreview(page: QuartzPluginData): FolderCardPreview | undefined {
  const candidate = page.folderCardPreview as Partial<FolderCardPreview> | undefined
  if (candidate && Array.isArray(candidate.items) && typeof candidate.remainingCount === "number") {
    return candidate as FolderCardPreview
  }

  return undefined
}

function formatMoreLabel(locale: string, count: number, suffix: string) {
  if (locale.toLowerCase().startsWith("ko")) {
    return `+${count}${suffix}`
  }

  return `+${count} ${suffix}`
}

export const PageList: QuartzComponent = ({ cfg, fileData, allFiles, limit, sort }: Props) => {
  const sorter = sort ?? byDateAndAlphabeticalFolderFirst(cfg)
  let list = allFiles.sort(sorter)
  const defaultDescription = i18n(cfg.locale).propertyDefaults.description
  const labels = getPageListLabels(cfg.locale)
  if (limit) {
    list = list.slice(0, limit)
  }

  return (
    <ul class="section-ul">
      {list.map((page) => {
        const isFolder = isFolderPath(page.slug ?? "")
        const title = page.frontmatter?.title
        const folderPreview = isFolder ? getFolderCardPreview(page) : undefined
        const description =
          typeof page.description === "string" && page.description !== defaultDescription
            ? page.description.trim()
            : ""
        const tags = page.frontmatter?.tags ?? []

        return (
          <li key={page.slug} class={`section-li ${isFolder ? "is-folder" : "is-note"}`}>
            <div class="section">
              <div class="section-head">
                <span class="entry-kind">{isFolder ? labels.folder : labels.note}</span>
                <p class="meta">
                  {page.dates && <Date date={getDate(cfg, page)!} locale={cfg.locale} />}
                </p>
              </div>
              <div class="desc">
                <h3>
                  <a href={resolveRelative(fileData.slug!, page.slug!)} class="internal">
                    {title}
                  </a>
                </h3>
                {description.length > 0 && <p class="summary">{description}</p>}
                {isFolder && folderPreview && folderPreview.items.length > 0 && (
                  <ul class="folder-preview">
                    {folderPreview.items.map((item) => (
                      <li
                        key={item.slug}
                        class={`folder-preview-item ${item.isFolder ? "is-folder" : "is-note"}`}
                      >
                        <a href={resolveRelative(fileData.slug!, item.slug)} class="internal">
                          {item.title}
                        </a>
                      </li>
                    ))}
                    {folderPreview.remainingCount > 0 && (
                      <li class="folder-preview-more">
                        {formatMoreLabel(cfg.locale, folderPreview.remainingCount, labels.more)}
                      </li>
                    )}
                  </ul>
                )}
              </div>
              {isFolder && page.dates && folderPreview && (
                <p class="meta folder-meta">
                  <span class="meta-label">{labels.updated}</span>
                  <Date date={getDate(cfg, page)!} locale={cfg.locale} />
                </p>
              )}
              <div class="section-footer">
                {tags.length > 0 && (
                  <ul class="tags">
                    {tags.map((tag) => (
                      <li>
                        <a
                          class="internal tag-link"
                          href={resolveRelative(fileData.slug!, `tags/${tag}` as FullSlug)}
                        >
                          {tag}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

PageList.css = `
.section h3 {
  margin: 0;
}

.section .summary {
  margin: 0;
}

.section > .tags {
  margin: 0;
  padding: 0;
}

.section .folder-preview {
  margin: 0;
  padding: 0;
}
`
