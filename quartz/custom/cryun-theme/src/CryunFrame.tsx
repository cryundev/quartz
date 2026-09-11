import { pathToRoot, resolveRelative } from "@quartz-community/utils"
import type { PageFrame } from "../../../components/frames"
import { getNavigationSections } from "./navigation"

export const CryunFrame: PageFrame = {
  name: "cryun",
  render({
    componentData,
    header,
    beforeBody,
    pageBody: Content,
    afterBody,
    left,
    right,
    footer: Footer,
  }) {
    const { fileData, allFiles } = componentData
    const root = pathToRoot(fileData.slug!)
    const isHome = fileData.slug === "index"
    const sections = getNavigationSections(allFiles)
    return (
      <>
        <a class="cryun-skip" href="#cryun-main">
          본문으로 건너뛰기
        </a>
        <header class="cryun-header">
          <div class="cryun-header-row">
            <div class="cryun-header-tools">
              {left.map((Component) => (
                <Component {...componentData} />
              ))}
              {header.map((Component) => (
                <Component {...componentData} />
              ))}
            </div>
          </div>
          <nav class="cryun-menu" aria-label="주제별 탐색">
            <a href={root} aria-current={isHome ? "page" : undefined}>
              홈
            </a>
            {sections.map((section) => (
              <a
                href={resolveRelative(fileData.slug!, section.slug)}
                aria-current={fileData.slug!.startsWith(`${section.segment}/`) ? "true" : undefined}
              >
                {section.title}
              </a>
            ))}
          </nav>
        </header>
        <main id="cryun-main" class="center cryun-main" tabIndex={-1}>
          <div class="cryun-document">
            <div class="cryun-document-heading popover-hint">
              {beforeBody.map((Component) => (
                <Component {...componentData} />
              ))}
            </div>
            <Content {...componentData} />
          </div>
          <div class="page-footer">
            {afterBody.map((Component) => (
              <Component {...componentData} />
            ))}
          </div>
        </main>
        {right.length > 0 && (
          <details class="cryun-context right sidebar" open>
            <summary>
              목차 · 문서 트리<span aria-hidden="true">⌄</span>
            </summary>
            <div class="cryun-context-content">
              {right.map((Component) => (
                <Component {...componentData} />
              ))}
            </div>
          </details>
        )}
        <Footer {...componentData} />
      </>
    )
  },
}
