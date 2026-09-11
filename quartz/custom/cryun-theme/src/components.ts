import type { QuartzComponent, QuartzComponentConstructor } from "../../../components/types"
import { Explorer } from "./CryunExplorer"

declare const CRYUN_THEME_SCRIPT: string

export const CryunExplorer: QuartzComponentConstructor = () => {
  const component: QuartzComponent = Explorer
  component.afterDOMLoaded = CRYUN_THEME_SCRIPT
  return component
}
