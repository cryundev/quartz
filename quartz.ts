import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { frameRegistry } from "./quartz/components/frames"
import { CryunFrame } from "./quartz/custom/frames/CryunFrame"

frameRegistry.register(CryunFrame.name, CryunFrame, "cryun-local")

const config = await loadQuartzConfig()
export default config
export const layout = await loadQuartzLayout()
