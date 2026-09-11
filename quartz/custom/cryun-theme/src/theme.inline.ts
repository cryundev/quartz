import { setupExplorerDialog } from "./explorer.inline"

function setupCryunTheme() {
  const context = document.querySelector<HTMLDetailsElement>(".cryun-context")
  setupExplorerDialog()

  if (context) {
    const compact = window.matchMedia("(max-width: 1000px)")
    const updateContext = () => {
      // A modal inside a closed details element becomes invisible but stays modal.
      context.open =
        !compact.matches ||
        context.querySelector<HTMLDialogElement>(".cryun-explorer-dialog")?.open === true
    }
    updateContext()
    compact.addEventListener("change", updateContext)
    window.addCleanup(() => compact.removeEventListener("change", updateContext))

    // Keep long TOCs reachable when the card is taller than the viewport.
    const resizeObserver = new ResizeObserver(() => {
      context.style.setProperty("--cryun-context-height", `${context.offsetHeight}px`)
    })
    resizeObserver.observe(context)
    window.addCleanup(() => resizeObserver.disconnect())
  }

  // Keep the active section visible in the horizontally scrollable mobile menu.
  const menu = document.querySelector<HTMLElement>(".cryun-menu")
  const active = menu?.querySelector<HTMLElement>("[aria-current]")
  if (menu && active) {
    menu.scrollLeft = active.offsetLeft - menu.offsetLeft - 16
  }
}

document.addEventListener("nav", setupCryunTheme)
