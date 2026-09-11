export function setupExplorerDialog() {
  const dialog = document.querySelector<HTMLDialogElement>(".cryun-explorer-dialog")
  const trigger = document.querySelector<HTMLButtonElement>(".cryun-explorer-trigger")
  if (!dialog || !trigger) return

  const open = () => {
    dialog.showModal()
    trigger.setAttribute("aria-expanded", "true")
  }
  const closed = () => trigger.setAttribute("aria-expanded", "false")
  const dismiss = (event: MouseEvent) => {
    const bounds = dialog.getBoundingClientRect()
    if (
      event.target === dialog &&
      (event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom)
    )
      dialog.close()

    // Leave modified clicks to the browser (open in a new tab/window).
    if (
      event.button === 0 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !event.altKey &&
      event.target instanceof Element &&
      event.target.closest("a[href]")
    )
      dialog.close()
  }
  trigger.addEventListener("click", open)
  dialog.addEventListener("close", closed)
  dialog.addEventListener("click", dismiss)
  window.addCleanup(() => {
    trigger.removeEventListener("click", open)
    dialog.removeEventListener("close", closed)
    dialog.removeEventListener("click", dismiss)
    // Release the browser's modal state and CSS scroll lock before SPA replacement.
    if (dialog.open) dialog.close()
  })

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
  for (const folder of dialog.querySelectorAll<HTMLDetailsElement>("details[data-folder]")) {
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
}
