function setupCryunTheme() {
  const context = document.querySelector<HTMLDetailsElement>(".cryun-context")
  if (!context) return

  const compact = window.matchMedia("(max-width: 1000px)")
  const updateContext = () => {
    context.open = !compact.matches
  }
  updateContext()
  compact.addEventListener("change", updateContext)
  window.addCleanup(() => compact.removeEventListener("change", updateContext))

  const storageKey = "cryun-open-folders"
  let expanded: string[] = []
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]")
    if (Array.isArray(saved))
      expanded = saved.filter((value): value is string => typeof value === "string")
  } catch {
    /* Navigation still works when browser storage is unavailable. */
  }
  const folders = new Set(expanded)
  for (const folder of context.querySelectorAll<HTMLDetailsElement>("details[data-folder]")) {
    const slug = folder.dataset.folder!
    folder.open = folder.dataset.current === "true" || folders.has(slug)
    const saveExpanded = () => {
      if (folder.open) folders.add(slug)
      else folders.delete(slug)
      try {
        localStorage.setItem(storageKey, JSON.stringify([...folders]))
      } catch {
        /* Optional persistence. */
      }
    }
    folder.addEventListener("toggle", saveExpanded)
    window.addCleanup(() => folder.removeEventListener("toggle", saveExpanded))
  }

  // Keep the active section visible in the horizontally scrollable mobile menu.
  const menu = document.querySelector<HTMLElement>(".cryun-menu")
  const active = menu?.querySelector<HTMLElement>("[aria-current]")
  if (menu && active) {
    menu.scrollLeft = active.offsetLeft - menu.offsetLeft - 16
  }
}

document.addEventListener("nav", setupCryunTheme)
