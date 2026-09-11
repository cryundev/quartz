const normalize = (text: string) => text.normalize("NFKC").toLowerCase()

export function setupExplorerTree(dialog: HTMLDialogElement) {
  const input = dialog.querySelector<HTMLInputElement>(".cryun-explorer-search-input")
  const clear = dialog.querySelector<HTMLButtonElement>(".cryun-explorer-search-clear")
  const status = dialog.querySelector<HTMLElement>(".cryun-explorer-search-status")
  const empty = dialog.querySelector<HTMLElement>(".cryun-explorer-empty")
  const pane = dialog.querySelector<HTMLElement>(".cryun-explorer")
  if (!input || !clear || !status || !empty || !pane) return
  // Quartz may reuse the input DOM during SPA navigation; start each page unfiltered.
  input.value = ""

  // Index only the published tree already present in the page.
  const items = Array.from(pane.querySelectorAll<HTMLLIElement>(".cryun-tree li"), (element) => {
    const path: string[] = []
    for (
      let item: HTMLElement | null = element;
      item;
      item = item.parentElement?.closest("li") ?? null
    ) {
      const link = item.querySelector<HTMLAnchorElement>(
        ":scope > a, :scope > details > summary > a",
      )
      path.unshift(link?.textContent ?? "")
    }
    return {
      element,
      folder: element.querySelector<HTMLDetailsElement>(":scope > details[data-folder]"),
      text: normalize(path.join(" ")),
    }
  })

  const storageKey = "cryun-open-folders"
  let savedFolders: string[] = []
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]")
    if (Array.isArray(saved))
      savedFolders = saved.filter((value): value is string => typeof value === "string")
  } catch {
    /* Navigation still works when browser storage is unavailable. */
  }
  const expanded = new Set(savedFolders)
  let filtering = false
  const persist = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...expanded]))
    } catch {
      /* Optional persistence. */
    }
  }
  const rememberFolders = () => {
    let changed = false
    for (const { folder } of items) {
      if (!folder) continue
      if (folder.open === expanded.has(folder.dataset.folder!)) continue
      changed = true
      if (folder.open) expanded.add(folder.dataset.folder!)
      else expanded.delete(folder.dataset.folder!)
    }
    if (changed) persist()
  }
  for (const { folder } of items) {
    if (!folder) continue
    const slug = folder.dataset.folder!
    folder.open = folder.dataset.current === "true" || expanded.has(slug)
    if (folder.open) expanded.add(slug)
    const saveExpanded = () => {
      // Search expansion is temporary. Ignore queued, unchanged toggle events too.
      if (filtering || folder.open === expanded.has(slug)) return
      if (folder.open) expanded.add(slug)
      else expanded.delete(slug)
      persist()
    }
    folder.addEventListener("toggle", saveExpanded)
    window.addCleanup(() => folder.removeEventListener("toggle", saveExpanded))
  }

  const filter = () => {
    const terms = normalize(input.value).trim().split(/\s+/).filter(Boolean)
    const searching = terms.length > 0
    if (searching && !filtering) {
      // Capture the actual pre-search state even if a toggle event is still queued.
      rememberFolders()
    }
    filtering = searching
    let matches = 0
    const visible = new Set<HTMLElement>()
    for (const { element, text } of items) {
      const match = terms.every((term) => text.includes(term))
      element.hidden = filtering && !match
      if (filtering && match) {
        matches++
        for (
          let item: HTMLElement | null = element;
          item;
          item = item.parentElement?.closest("li") ?? null
        )
          visible.add(item)
      }
    }
    for (const element of visible) element.hidden = false
    for (const { folder } of items)
      if (folder) folder.open = filtering || expanded.has(folder.dataset.folder!)
    empty.hidden = !filtering || matches > 0
    status.textContent = filtering ? `${matches}개 항목 일치` : "전체 문서"
    clear.disabled = input.value.length === 0
    pane.scrollTop = 0
  }
  const reset = () => {
    input.value = ""
    filter()
    input.focus()
  }
  filter()
  input.addEventListener("input", filter)
  clear.addEventListener("click", reset)
  window.addCleanup(() => {
    input.removeEventListener("input", filter)
    clear.removeEventListener("click", reset)
  })
}
