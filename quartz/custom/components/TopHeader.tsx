import { componentRegistry } from "../../components/registry"
import { concatenateResources } from "../../util/resources"
import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../../components/types"
import HeaderMenuConstructor from "./HeaderMenu"
import SiteBrandConstructor from "./SiteBrand"

const SiteBrand = SiteBrandConstructor()
const HeaderMenu = HeaderMenuConstructor()

function externalComponent(name: string): QuartzComponent | undefined {
  const registered = componentRegistry.get(name)
  if (!registered) return undefined

  if (typeof registered.component === "function") {
    return componentRegistry.instantiate(
      registered.component as QuartzComponentConstructor,
      undefined,
    )
  }

  return registered.component as QuartzComponent
}

const TopHeader: QuartzComponent = (props: QuartzComponentProps) => {
  const Search = externalComponent("search") ?? externalComponent("Search")
  const Darkmode = externalComponent("darkmode") ?? externalComponent("Darkmode")
  const ReaderMode = externalComponent("reader-mode") ?? externalComponent("ReaderMode")

  return (
    <div class="top-header">
      <div class="top-header-brand">
        <SiteBrand {...props} />
      </div>
      <div class="top-header-menu">
        <HeaderMenu {...props} />
      </div>
      <div class="top-header-search">{Search && <Search {...props} />}</div>
      <div class="top-header-actions">
        {Darkmode && <Darkmode {...props} />}
        {ReaderMode && <ReaderMode {...props} />}
      </div>
    </div>
  )
}

TopHeader.css = concatenateResources(
  SiteBrand.css,
  HeaderMenu.css,
  `
.top-header {
  --header-surface-start: color-mix(in srgb, var(--light) 90%, white);
  --header-surface-end: color-mix(in srgb, var(--light) 98%, white);
  --header-border: color-mix(in srgb, var(--lightgray) 76%, var(--secondary) 10%);
  --header-shadow-primary: 0 20px 40px rgba(27, 33, 48, 0.08);
  --header-shadow-secondary: 0 8px 16px rgba(27, 33, 48, 0.04);
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr) minmax(20rem, 29rem);
  grid-template-rows: minmax(0, 1fr) auto;
  align-items: stretch;
  column-gap: 2rem;
  row-gap: 0.55rem;
  width: 100%;
  min-height: 7.25rem;
  padding: 1.25rem 1.55rem;
  box-sizing: border-box;
  border-radius: 1.5rem;
  border: 1px solid var(--header-border);
  background: linear-gradient(180deg, var(--header-surface-start) 0%, var(--header-surface-end) 100%);
  box-shadow: var(--header-shadow-primary), var(--header-shadow-secondary);
  backdrop-filter: blur(18px);
}

:root[saved-theme="dark"] .top-header {
  --header-surface-start: color-mix(in srgb, var(--page-surface-muted) 97%, #343638);
  --header-surface-end: color-mix(in srgb, var(--page-surface) 99%, #2f3133);
  --header-border: color-mix(in srgb, var(--lightgray) 86%, rgba(255, 255, 255, 0.05));
  --header-shadow-primary: 0 16px 34px rgba(0, 0, 0, 0.16);
  --header-shadow-secondary: 0 6px 14px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(14px);
}

.top-header-brand {
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: 2.5rem;
  grid-column: 1;
  grid-row: 1 / span 2;
  align-self: center;
  justify-self: start;
}

.top-header-menu {
  min-width: 0;
  max-width: 100%;
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: end;
  justify-self: end;
  padding-bottom: 0.15rem;
}

.top-header-search {
  grid-column: 3;
  grid-row: 1;
  width: min(100%, 30rem);
  justify-self: end;
  align-self: center;
}

.top-header-search > .search {
  width: 100%;
  max-width: none;
  margin-left: 0;
}

.top-header-actions {
  grid-column: 3;
  grid-row: 2;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.55rem;
}

.top-header-actions .darkmode,
.top-header-actions .readermode {
  display: block;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--lightgray) 72%, var(--secondary) 12%);
  background: color-mix(in srgb, var(--light) 88%, white);
  box-shadow: 0 8px 20px rgba(27, 33, 48, 0.06);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.top-header-actions .darkmode:hover,
.top-header-actions .readermode:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--secondary) 28%, var(--lightgray));
  box-shadow: 0 12px 24px rgba(27, 33, 48, 0.1);
}

.top-header-actions .darkmode svg,
.top-header-actions .readermode svg {
  width: 18px;
  height: 18px;
  top: calc(50% - 9px);
  left: calc(50% - 9px);
}

@media all and (max-width: 800px) {
  .top-header {
    min-height: auto;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto auto auto;
    row-gap: 0.85rem;
    padding: 1rem;
  }

  .top-header-brand,
  .top-header-menu,
  .top-header-search,
  .top-header-actions {
    grid-column: 1;
    justify-self: stretch;
  }

  .top-header-brand {
    grid-row: 1;
  }

  .top-header-menu {
    grid-row: 2;
    align-self: stretch;
    justify-self: stretch;
    padding-bottom: 0;
  }

  .top-header-search {
    grid-row: 3;
    width: 100%;
  }

  .top-header-actions {
    grid-row: 4;
    justify-content: flex-start;
  }
}
`,
)

export default (() => TopHeader) satisfies QuartzComponentConstructor
