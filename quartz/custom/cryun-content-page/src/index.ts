import { PageMatcher, QuartzPageTypePlugin } from "../../../plugins/types"
import ContentBody from "./components/ContentBody"

export interface CryunContentPageOptions {}

const contentMatcher: PageMatcher = ({ slug }) => {
  if (slug.endsWith("/index")) return false
  if (slug.startsWith("tags/")) return false
  return true
}

export const CryunContentPage: QuartzPageTypePlugin<CryunContentPageOptions> = () => ({
  name: "CryunContentPage",
  priority: 0,
  match: contentMatcher,
  layout: "content",
  body: ContentBody,
})

export default CryunContentPage
