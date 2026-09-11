import { setupExplorerTree } from "./explorer-tree.inline"

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
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || event.isComposing) return
    // Search inputs otherwise consume Escape to clear themselves first.
    event.preventDefault()
    event.stopPropagation()
    dialog.close()
  }
  trigger.addEventListener("click", open)
  dialog.addEventListener("close", closed)
  dialog.addEventListener("click", dismiss)
  dialog.addEventListener("keydown", closeOnEscape)
  window.addCleanup(() => {
    trigger.removeEventListener("click", open)
    dialog.removeEventListener("close", closed)
    dialog.removeEventListener("click", dismiss)
    dialog.removeEventListener("keydown", closeOnEscape)
    // Release the browser's modal state and CSS scroll lock before SPA replacement.
    if (dialog.open) dialog.close()
  })

  setupExplorerTree(dialog)
}
