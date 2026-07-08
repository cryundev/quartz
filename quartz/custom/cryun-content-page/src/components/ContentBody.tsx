import { Node } from "hast"
import { htmlToJsx } from "../../../../util/jsx"
import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../../../../components/types"

const ContentBody: QuartzComponent = ({ fileData, tree }: QuartzComponentProps) => {
  const content = htmlToJsx(fileData.filePath!, tree as Node)
  const classes = fileData.frontmatter?.cssclasses ?? []

  return <article class={classes.join(" ")}>{content}</article>
}

export default (() => ContentBody) satisfies QuartzComponentConstructor
