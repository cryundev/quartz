import { PageFrame, PageFrameProps } from "../../components/frames/types"
import TopHeaderConstructor from "../components/TopHeader"

const TopHeader = TopHeaderConstructor()

function cssText(resource: string | string[] | undefined): string {
  if (!resource) return ""
  return Array.isArray(resource) ? resource.join("\n") : resource
}

const frameStyle = `
body {
  background:
    radial-gradient(circle at top right, rgba(132, 165, 157, 0.16), transparent 28%),
    linear-gradient(180deg, color-mix(in srgb, var(--light) 84%, white) 0%, var(--light) 100%);
}

:root[saved-theme="dark"] body {
  background:
    radial-gradient(circle at top right, rgba(141, 162, 172, 0.1), transparent 30%),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--light) 98%, #1b1c1e) 0%,
      color-mix(in srgb, var(--light) 94%, #141516) 100%
    );
}

.page[data-frame="cryun"] {
  --layout-gap: 1.35rem;
  --page-surface: color-mix(in srgb, var(--light) 88%, white);
  --page-surface-muted: color-mix(in srgb, var(--light) 76%, white);
  --page-border: color-mix(in srgb, var(--lightgray) 70%, var(--secondary) 10%);
  --page-shadow: 0 28px 60px rgba(27, 33, 48, 0.08), 0 10px 20px rgba(27, 33, 48, 0.05);
  width: min(1460px, calc(100% - 2rem));
  max-width: 1460px;
  margin: 0 auto 3rem;
}

:root[saved-theme="dark"] .page[data-frame="cryun"] {
  --page-surface: color-mix(in srgb, var(--light) 97%, #2b2d2f);
  --page-surface-muted: color-mix(in srgb, var(--light) 94%, #313335);
  --page-border: color-mix(in srgb, var(--lightgray) 82%, var(--secondary) 10%);
  --page-shadow: 0 22px 48px rgba(0, 0, 0, 0.22), 0 10px 22px rgba(0, 0, 0, 0.16);
}

.page[data-frame="cryun"] > #quartz-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(17rem, 20rem);
  grid-template-rows: auto auto auto;
  grid-template-areas:
    "grid-header grid-header"
    "grid-center grid-sidebar-right"
    "grid-footer grid-sidebar-right";
  column-gap: clamp(1.5rem, 2vw, 2.5rem);
  row-gap: var(--layout-gap);
}

.page[data-frame="cryun"] > #quartz-body:has(> .sidebar.right:empty) {
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    "grid-header"
    "grid-center"
    "grid-footer";
}

.page[data-frame="cryun"] > #quartz-body:has(> .sidebar.right:empty) > .sidebar.right {
  display: none;
}

.page[data-frame="cryun"] .page-header {
  grid-area: grid-header;
  width: 100%;
  margin: 1.5rem 0 0;
}

.page[data-frame="cryun"] .center {
  grid-area: grid-center;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  min-width: 0;
}

.page[data-frame="cryun"] .sidebar.right {
  grid-area: grid-sidebar-right;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-self: start;
  position: sticky;
  top: 1.4rem;
  height: fit-content;
  max-height: calc(100vh - 2.5rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 0.2rem;
  box-sizing: border-box;
}

.page[data-frame="cryun"] .sidebar.right > * {
  background: var(--page-surface-muted);
  border: 1px solid var(--page-border);
  border-radius: 1.3rem;
  padding: 1.1rem 1.15rem;
  box-shadow: 0 14px 32px rgba(27, 33, 48, 0.06);
  backdrop-filter: blur(10px);
  width: 100%;
  box-sizing: border-box;
  flex: 0 0 auto;
}

.page[data-frame="cryun"] .center-content,
.page[data-frame="cryun"] .page-footer,
.page[data-frame="cryun"] hr,
.page[data-frame="cryun"] footer {
  width: 100%;
  max-width: none;
}

.page[data-frame="cryun"] .center-content {
  background: var(--page-surface);
  border: 1px solid var(--page-border);
  border-radius: 1.7rem;
  box-shadow: var(--page-shadow);
  overflow: hidden;
  justify-self: stretch;
}

.page[data-frame="cryun"] .center-content > .page-lede {
  margin-top: 0;
  padding: 2.35rem 2.7rem 1.5rem;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--page-surface-muted) 82%, white) 0%,
    var(--page-surface) 100%
  );
  border-bottom: 1px solid color-mix(in srgb, var(--page-border) 88%, transparent);
}

.page[data-frame="cryun"] .center-content > .page-lede:empty {
  display: none;
}

.page[data-frame="cryun"] .center-content > .page-lede > * {
  max-width: 58rem;
  margin-left: auto;
  margin-right: auto;
}

.page[data-frame="cryun"] .center-content > :not(.page-lede).popover-hint {
  margin-top: 0;
  padding: 1.95rem 2.7rem 3.35rem;
  width: 100%;
  box-sizing: border-box;
}

.page[data-frame="cryun"] .center-content > :not(.page-lede).popover-hint > * {
  max-width: 58rem;
  margin-left: auto;
  margin-right: auto;
}

.page[data-frame="cryun"] .center-content > :not(.page-lede).popover-hint > :first-child {
  margin-top: 0;
}

.page[data-frame="cryun"] .center-content:has(> .page-lede:empty) > :not(.page-lede).popover-hint {
  padding-top: 2.6rem;
}

.page[data-frame="cryun"] .page-footer {
  margin-top: 0.5rem;
  align-self: stretch;
}

.page[data-frame="cryun"] hr {
  border: none;
  border-top: 1px solid color-mix(in srgb, var(--lightgray) 82%, transparent);
  margin: 0.75rem auto 0;
  align-self: stretch;
}

.page[data-frame="cryun"] footer {
  grid-area: grid-footer;
  margin-left: 0;
  align-self: stretch;
}

.page[data-frame="cryun"] article {
  font-size: 1.02rem;
  line-height: 1.9;
}

.page[data-frame="cryun"] article p,
.page[data-frame="cryun"] article ul,
.page[data-frame="cryun"] article ol,
.page[data-frame="cryun"] article li {
  line-height: 1.9;
}

.page[data-frame="cryun"] article img {
  display: block;
  max-width: 100%;
  margin: 2rem auto;
  border-radius: 1.15rem;
  box-shadow: 0 20px 45px rgba(27, 33, 48, 0.12);
}

.page[data-frame="cryun"] blockquote {
  margin: 1.4rem 0;
  border-left: 4px solid color-mix(in srgb, var(--secondary) 72%, var(--tertiary));
  padding: 0.9rem 0 0.9rem 1.2rem;
  border-radius: 0 1rem 1rem 0;
  background: color-mix(in srgb, var(--highlight) 88%, white);
}

.page[data-frame="cryun"] pre {
  border-radius: 1rem;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  border: 1px solid color-mix(in srgb, var(--lightgray) 82%, var(--secondary) 8%);
}

.page[data-frame="cryun"] .table-container {
  width: calc(100% - 0.5rem);
  margin: 1.3rem auto 1.9rem;
  padding: 0 0.25rem;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.page[data-frame="cryun"] .table-container > table {
  width: 100%;
  min-width: max-content;
}

@media all and (max-width: 1200px) {
  .page[data-frame="cryun"] > #quartz-body {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "grid-header"
      "grid-center"
      "grid-sidebar-right"
      "grid-footer";
  }

  .page[data-frame="cryun"] .sidebar.right {
    position: initial;
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }
}

@media all and (max-width: 800px) {
  .page[data-frame="cryun"] {
    width: calc(100% - 1rem);
    margin-bottom: 2rem;
  }

  .page[data-frame="cryun"] .page-header {
    margin-top: 1rem;
  }

  .page[data-frame="cryun"] .center-content > .page-lede {
    padding: 1.65rem 1.2rem 1.1rem;
  }

  .page[data-frame="cryun"] .center-content > :not(.page-lede).popover-hint {
    padding: 1.5rem 1.2rem 2.35rem;
  }

  .page[data-frame="cryun"] .center-content,
  .page[data-frame="cryun"] .center-content > :not(.page-lede).popover-hint,
  .page[data-frame="cryun"] .center-content > :not(.page-lede).popover-hint > * {
    min-width: 0;
  }
}
`

export const CryunFrame: PageFrame = {
  name: "cryun",
  css: `${cssText(TopHeader.css)}\n${frameStyle}`,
  render({
    componentData,
    beforeBody,
    pageBody: Content,
    afterBody,
    right,
    footer: Footer,
  }: PageFrameProps) {
    return (
      <>
        <div class="page-header">
          <TopHeader {...componentData} />
        </div>
        <div class="center">
          <div class="center-content">
            <div class="page-lede popover-hint">
              {beforeBody.map((BodyComponent) => (
                <BodyComponent {...componentData} />
              ))}
            </div>
            <Content {...componentData} />
          </div>
          <hr />
          <div class="page-footer">
            {afterBody.map((BodyComponent) => (
              <BodyComponent {...componentData} />
            ))}
          </div>
        </div>
        <div class="right sidebar">
          {right.map((BodyComponent) => (
            <BodyComponent {...componentData} />
          ))}
        </div>
        <Footer {...componentData} />
      </>
    )
  },
}
