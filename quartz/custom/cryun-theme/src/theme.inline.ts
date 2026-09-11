import { setupExplorerDialog } from "./explorer.inline"

function setupCryunTheme() {
  const context = document.querySelector<HTMLDetailsElement>(".cryun-context")
  setupExplorerDialog()

  if (context) {
    const compact = window.matchMedia("(max-width: 1000px)")
    const updateContext = () => {
      context.open = !compact.matches
    }
    updateContext()
    compact.addEventListener("change", updateContext)
    window.addCleanup(() => compact.removeEventListener("change", updateContext))
  }

  // Keep the active section visible in the horizontally scrollable mobile menu.
  const menu = document.querySelector<HTMLElement>(".cryun-menu")
  const active = menu?.querySelector<HTMLElement>("[aria-current]")
  if (menu && active) {
    menu.scrollLeft = active.offsetLeft - menu.offsetLeft - 16
  }
}

document.addEventListener("nav", setupCryunTheme)
