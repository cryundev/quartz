import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const Header: QuartzComponent = ({ children }: QuartzComponentProps) => {
  return children.length > 0 ? <header>{children}</header> : null
}

Header.css = `
header {
  width: 100%;
  margin: 0;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--lightgray);
}
`

export default (() => Header) satisfies QuartzComponentConstructor
