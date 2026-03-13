import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const Header: QuartzComponent = ({ children }: QuartzComponentProps) => {
  return children.length > 0 ? <header>{children}</header> : null
}

Header.css = `
header {
  width: 100%;
  margin: 0;
  padding: 0;
  border: none;
}
`

export default (() => Header) satisfies QuartzComponentConstructor
