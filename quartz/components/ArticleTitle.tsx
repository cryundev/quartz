import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const ArticleTitle: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const title = fileData.frontmatter?.title
  if (title) {
    return <h1 class={classNames(displayClass, "article-title")}>{title}</h1>
  } else {
    return null
  }
}

ArticleTitle.css = `
.article-title {
  margin: 0.58rem 0 1.05rem;
  font-family: var(--titleFont);
  font-size: clamp(1.95rem, 1.55rem + 1.35vw, 2.8rem);
  line-height: 1.2;
  letter-spacing: -0.025em;
  text-wrap: pretty;
  overflow-wrap: anywhere;
  max-width: min(100%, 24ch);
}

@media (max-width: 800px) {
  .article-title {
    margin: 0.45rem 0 0.9rem;
    font-size: clamp(1.65rem, 1.35rem + 1.6vw, 2.2rem);
    max-width: 100%;
    line-height: 1.24;
  }
}
`

export default (() => ArticleTitle) satisfies QuartzComponentConstructor
