import { concatenateResources } from "../util/resources"
import { classNames } from "../util/lang"
import DarkmodeConstructor from "./Darkmode"
import HeaderMenuConstructor from "./HeaderMenu"
import ReaderModeConstructor from "./ReaderMode"
import SearchConstructor from "./Search"
import SiteBrandConstructor from "./SiteBrand"
import style from "./styles/topHeader.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const SiteBrand = SiteBrandConstructor()
const HeaderMenu = HeaderMenuConstructor()
const Search = SearchConstructor()
const Darkmode = DarkmodeConstructor()
const ReaderMode = ReaderModeConstructor()

const TopHeader: QuartzComponent = (props: QuartzComponentProps) => {
  return (
    <div class={classNames(props.displayClass, "top-header")}>
      <div class="top-header-brand">
        <SiteBrand {...props} />
      </div>
      <div class="top-header-menu">
        <HeaderMenu {...props} />
      </div>
      <div class="top-header-search">
        <Search {...props} />
      </div>
      <div class="top-header-actions">
        <Darkmode {...props} />
        <ReaderMode {...props} />
      </div>
    </div>
  )
}

TopHeader.beforeDOMLoaded = concatenateResources(
  Search.beforeDOMLoaded,
  Darkmode.beforeDOMLoaded,
  ReaderMode.beforeDOMLoaded,
)
TopHeader.afterDOMLoaded = concatenateResources(
  Search.afterDOMLoaded,
  Darkmode.afterDOMLoaded,
  ReaderMode.afterDOMLoaded,
)
TopHeader.css = concatenateResources(
  SiteBrand.css,
  HeaderMenu.css,
  Search.css,
  Darkmode.css,
  ReaderMode.css,
  style,
)

export default (() => TopHeader) satisfies QuartzComponentConstructor
