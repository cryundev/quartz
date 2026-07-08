import { i18n } from "../../i18n"
import { QuartzPluginData } from "../../plugins/vfile"
import { FullSlug, isFolderPath, resolveRelative } from "../../util/path"
import { QuartzComponent, QuartzComponentProps } from "../../components/types"

export type SortFn = (f1: QuartzPluginData, f2: QuartzPluginData) => number

type PageEntry = QuartzPluginData & {
  folderCardPreview?: FolderCardPreview
}

type FolderCardPreviewItem = {
  title: string
  slug: FullSlug
  isFolder: boolean
}

export type FolderCardPreview = {
  items: FolderCardPreviewItem[]
  remainingCount: number
}

function getPageDate(page: QuartzPluginData): Date | undefined {
  return page.dates?.modified ?? page.dates?.published ?? page.dates?.created
}

export function byDateAndAlphabeticalFolderFirst(): SortFn {
  return (f1, f2) => {
    const f1IsFolder = isFolderPath(f1.slug ?? "")
    const f2IsFolder = isFolderPath(f2.slug ?? "")
    if (f1IsFolder && !f2IsFolder) return -1
    if (!f1IsFolder && f2IsFolder) return 1

    const f1Date = getPageDate(f1)
    const f2Date = getPageDate(f2)
    if (f1Date && f2Date) return f2Date.getTime() - f1Date.getTime()
    if (f1Date && !f2Date) return -1
    if (!f1Date && f2Date) return 1

    const f1Title = f1.frontmatter?.title?.toLowerCase() ?? ""
    const f2Title = f2.frontmatter?.title?.toLowerCase() ?? ""
    return f1Title.localeCompare(f2Title, undefined, { numeric: true, sensitivity: "base" })
  }
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

function formatMoreLabel(locale: string, count: number, suffix: string) {
  if (locale.toLowerCase().startsWith("ko")) {
    return `+${count}${suffix}`
  }

  return `+${count} ${suffix}`
}

function DateDisplay({ date, locale }: { date: Date; locale: string }) {
  return (
    <time dateTime={date.toISOString()}>
      {date.toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })}
    </time>
  )
}

type PageListProps = {
  limit?: number
  sort?: SortFn
} & QuartzComponentProps

export const PageList: QuartzComponent = ({
  cfg,
  fileData,
  allFiles,
  limit,
  sort,
}: PageListProps) => {
  const sorter = sort ?? byDateAndAlphabeticalFolderFirst()
  let list = [...allFiles].sort(sorter) as PageEntry[]
  if (limit) {
    list = list.slice(0, limit)
  }

  const defaultDescription = i18n(cfg.locale).propertyDefaults.description
  const labels = getPageListLabels(cfg.locale)

  return (
    <ul class="section-ul">
      {list.map((page) => {
        const isFolder = isFolderPath(page.slug ?? "")
        const title = page.frontmatter?.title
        const folderPreview = isFolder ? page.folderCardPreview : undefined
        const date = getPageDate(page)
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
                <p class="meta">{date && <DateDisplay date={date} locale={cfg.locale} />}</p>
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
              {isFolder && date && folderPreview && (
                <p class="meta folder-meta">
                  <span class="meta-label">{labels.updated}</span>
                  <DateDisplay date={date} locale={cfg.locale} />
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

export const pageListStyle = `
.page-listing {
  margin-top: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.page-listing > p {
  margin: 0;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--gray);
}

.page-listing > div {
  width: 100%;
}

.folder-content-view .page-listing,
.tag-content-view .page-listing {
  gap: 1.15rem;
}

.folder-content-view .page-listing > p,
.folder-content-view .page-listing > div,
.tag-content-view .page-listing > p,
.tag-content-view .page-listing > div,
.tag-content-view > .tag-summary,
.tag-section {
  width: min(100%, 56.75rem);
  margin-left: auto;
  margin-right: auto;
}

.tag-content-view > .tag-summary {
  margin-top: 0;
  color: var(--gray);
  font-size: 0.9rem;
}

.tag-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.tag-section > h2 {
  margin-top: 0;
  margin-bottom: 0.85rem;
  font-size: 1.05rem;
}

.tag-section > p {
  margin-top: 0;
  margin-bottom: 0.85rem;
  color: color-mix(in srgb, var(--darkgray) 82%, var(--gray) 18%);
}

.popover-hint > article:empty {
  display: none;
}

.popover-hint > article:not(:empty) {
  margin-bottom: 2rem;
  padding: 1.45rem 1.6rem;
  background: color-mix(in srgb, var(--page-surface-muted) 76%, white 24%);
  border: 1px solid color-mix(in srgb, var(--page-border) 82%, transparent);
  border-radius: 1.25rem;
}

.popover-hint > article:not(:empty) > :first-child {
  margin-top: 0;
}

.popover-hint > article:not(:empty) > :last-child {
  margin-bottom: 0;
}

.popover-hint > article:not(:empty) + .page-listing {
  padding-top: 1.85rem;
  border-top: 1px solid color-mix(in srgb, var(--page-border) 82%, transparent);
}

ul.section-ul {
  list-style: none;
  margin: 0;
  padding-left: 0;
  display: grid;
  gap: 1rem;
}

li.section-li {
  margin: 0;
}

li.section-li > .section {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1.35rem 1.4rem;
  background: color-mix(in srgb, var(--page-surface-muted) 74%, white 26%);
  border: 1px solid color-mix(in srgb, var(--page-border) 80%, transparent);
  border-radius: 1.25rem;
  box-shadow: 0 14px 34px rgba(27, 33, 48, 0.06);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

li.section-li > .section:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--page-border) 55%, var(--secondary) 30%);
  box-shadow: 0 18px 38px rgba(27, 33, 48, 0.1);
}

li.section-li.is-folder > .section {
  background: color-mix(in srgb, var(--page-surface-muted) 88%, var(--tertiary) 12%);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.entry-kind {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.32rem 0.72rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--page-border) 74%, transparent);
  background: color-mix(in srgb, var(--highlight) 45%, white 55%);
  color: var(--secondary);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.entry-kind::before {
  content: "";
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.72;
}

.section .meta {
  margin: 0;
  font-size: 0.82rem;
  color: var(--gray);
  white-space: nowrap;
}

.section .desc {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.section .desc > h3 {
  margin: 0;
  font-size: 1.12rem;
  line-height: 1.45;
}

.section .desc > h3 > a {
  background-color: transparent;
  padding: 0;
  line-height: inherit;
  color: var(--dark);
}

.section .desc > .summary {
  margin: 0;
  color: color-mix(in srgb, var(--darkgray) 84%, var(--gray) 16%);
  font-size: 0.95rem;
  line-height: 1.72;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.section .folder-preview {
  display: grid;
  gap: 0.45rem;
  margin: 0.25rem 0 0;
  padding: 0;
  list-style: none;
}

.section .folder-preview-item {
  list-style: none;
}

.section .folder-preview-item a.internal {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.58rem 0.75rem;
  border-radius: 0.9rem;
  background: color-mix(in srgb, var(--highlight) 34%, white 66%);
  border: 1px solid color-mix(in srgb, var(--page-border) 66%, transparent);
  color: color-mix(in srgb, var(--darkgray) 88%, var(--gray) 12%);
  line-height: 1.25;
}

.section .folder-preview-item a.internal::before {
  content: "";
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.65;
  flex: 0 0 auto;
}

.section .folder-preview-more {
  list-style: none;
  color: var(--gray);
  font-size: 0.78rem;
  line-height: 1.35;
  padding-left: 0.1rem;
}

.section .folder-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: -0.1rem;
}

.section .folder-meta .meta-label {
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.72;
}

.section > .tags,
.section-footer .tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.1rem 0 0;
  padding: 0;
}

.section > .tags > li,
.section-footer .tags > li {
  list-style: none;
}

.section > .tags a.internal,
.section-footer .tags a.internal {
  display: inline-flex;
  align-items: center;
  padding: 0.28rem 0.6rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--highlight) 58%, white 42%);
  line-height: 1.2;
  font-size: 0.78rem;
}

@media all and (max-width: 800px) {
  .popover-hint > article:not(:empty) {
    margin-bottom: 1.5rem;
    padding: 1.15rem 1.2rem;
  }

  .popover-hint > article:not(:empty) + .page-listing {
    padding-top: 1.5rem;
  }

  .folder-content-view .page-listing > p,
  .folder-content-view .page-listing > div,
  .tag-content-view .page-listing > p,
  .tag-content-view .page-listing > div,
  .tag-content-view > .tag-summary,
  .tag-section {
    width: 100%;
  }
}
`

PageList.css = pageListStyle
