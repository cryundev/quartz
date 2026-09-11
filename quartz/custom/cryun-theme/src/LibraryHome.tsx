import { resolveRelative } from "@quartz-community/utils"
import type { QuartzComponentProps } from "../../../components/types"
import { getLibrary, noteDate, sectionLabel } from "./library"

export function LibraryHome({ allFiles, fileData, cfg }: QuartzComponentProps) {
  const { sections, notes } = getLibrary(allFiles)
  return (
    <div class="cryun-home">
      <div class="cryun-home-intro">
        <p class="cryun-eyebrow">PERSONAL KNOWLEDGE BASE</p>
        <h1>
          기록을 연결하고,
          <br />
          이해를 쌓는 공간.
        </h1>
        <p class="cryun-home-description">
          개발하며 배우고 정리한 지식들. 주제를 따라 탐색하거나, 필요한 문서를 검색해 보세요.
        </p>
        <p class="cryun-home-stats">
          <span>{sections.length}개의 주제</span>
          <span>{notes.length}개의 문서</span>
        </p>
      </div>
      <section class="cryun-collections" aria-labelledby="cryun-collections-title">
        <div class="cryun-section-heading">
          <h2 id="cryun-collections-title">주제별 탐색</h2>
          <span>COLLECTIONS</span>
        </div>
        <div class="cryun-collection-grid">
          {sections.map((section, index) => (
            <a
              class="cryun-collection internal"
              href={resolveRelative(fileData.slug!, section.slug)}
            >
              <span class="cryun-collection-number">{String(index + 1).padStart(2, "0")}</span>
              <h3>{section.title}</h3>
              <p>
                {section.notes
                  .slice(0, 2)
                  .map((note) => note.frontmatter?.title)
                  .join(" · ")}
              </p>
              <span class="cryun-collection-footer">
                <span>{section.notes.length}개의 문서</span>
                <span aria-hidden="true">↗</span>
              </span>
            </a>
          ))}
        </div>
      </section>
      <section class="cryun-recent" aria-labelledby="cryun-recent-title">
        <div class="cryun-section-heading">
          <h2 id="cryun-recent-title">최근 업데이트</h2>
          <span>RECENT NOTES</span>
        </div>
        <ul>
          {notes.slice(0, 5).map((note) => {
            const date = noteDate(note)
            return (
              <li>
                <a class="internal" href={resolveRelative(fileData.slug!, note.slug!)}>
                  <span class="cryun-recent-section">
                    {note.slug!.includes("/")
                      ? (sections.find((section) => section.segment === note.slug!.split("/")[0])
                          ?.title ?? sectionLabel(note.slug!.split("/")[0]))
                      : "노트"}
                  </span>
                  <span class="cryun-recent-title">{note.frontmatter?.title}</span>
                  {date && (
                    <time dateTime={date.toISOString()}>
                      {date.toLocaleDateString(cfg.locale, {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </time>
                  )}
                  <span class="cryun-recent-arrow" aria-hidden="true">
                    ↗
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
