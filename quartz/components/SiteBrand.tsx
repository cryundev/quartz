import { i18n } from "../i18n"
import { classNames } from "../util/lang"
import { joinSegments, pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const SiteBrand: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const title = cfg?.pageTitle ?? i18n(cfg.locale).propertyDefaults.title
  const baseDir = pathToRoot(fileData.slug!)
  const iconPath = joinSegments(baseDir, "static/icon.png")

  return (
    <a class={classNames(displayClass, "site-brand")} href={baseDir}>
      <img class="site-brand-icon" src={iconPath} alt="" width={40} height={40} />
      <span class="site-brand-title">{title}</span>
    </a>
  )
}

SiteBrand.css = `
.site-brand {
  display: grid;
  grid-template-columns: 2.5rem max-content;
  align-items: center;
  column-gap: 0.85rem;
  min-width: 0;
  min-height: 2.5rem;
  color: var(--dark);
  line-height: 1;
  white-space: nowrap;
  overflow-wrap: normal;
}

.site-brand:hover {
  color: var(--dark);
}

.site-brand-icon {
  display: block;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.8rem;
  object-fit: cover;
  flex-shrink: 0;
  align-self: center;
}

.site-brand-title {
  display: flex;
  align-items: center;
  font-family: var(--titleFont);
  font-size: clamp(1.2rem, 1rem + 0.9vw, 1.8rem);
  font-weight: 700;
  height: 2.5rem;
  line-height: 2.5rem;
  white-space: nowrap;
  text-wrap: nowrap;
  overflow-wrap: normal;
  margin: 0;
  padding: 0;
  transform: none;
}
`

export default (() => SiteBrand) satisfies QuartzComponentConstructor
