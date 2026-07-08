// ../../components/registry.ts
var ComponentRegistry = class {
  components = /* @__PURE__ */ new Map()
  instanceCache = /* @__PURE__ */ new Map()
  optionOverrides = /* @__PURE__ */ new Map()
  register(name, component, source, manifest) {
    const existing = this.components.get(name)
    if (existing && existing.source !== source) {
      console.warn(`Component "${name}" is being overwritten by ${source}`)
    }
    this.components.set(name, { component, source, manifest })
  }
  get(name) {
    return this.components.get(name)
  }
  getAll() {
    return new Map(this.components)
  }
  /** Store option overrides for a plugin, keyed by plugin directory name. */
  setOptionOverrides(pluginName, opts) {
    if (!opts || Object.keys(opts).length === 0) return
    this.optionOverrides.set(pluginName, { ...this.optionOverrides.get(pluginName), ...opts })
    this.instanceCache.clear()
  }
  getOptionOverrides(pluginName) {
    return this.optionOverrides.get(pluginName)
  }
  /**
   * Instantiate a component constructor with options, returning a cached instance
   * if the same constructor was already called with equivalent options.
   * This prevents duplicate afterDOMLoaded scripts when the same component
   * appears in multiple page-type layouts.
   */
  instantiate(constructor, options) {
    const optsKey = options !== void 0 ? JSON.stringify(options) : ""
    const ctorId =
      constructor.__cacheId ?? (constructor.__cacheId = `ctor_${this.instanceCache.size}`)
    const cacheKey = `${ctorId}:${optsKey}`
    const cached = this.instanceCache.get(cacheKey)
    if (cached) return cached
    const instance = constructor(options)
    this.instanceCache.set(cacheKey, instance)
    return instance
  }
  getAllComponents() {
    const seen = /* @__PURE__ */ new Set()
    const results = []
    for (const r of this.components.values()) {
      if (seen.has(r.component)) continue
      seen.add(r.component)
      try {
        let instance
        if (typeof r.component === "function") {
          const existing = this.findCachedInstance(r.component)
          instance = existing ?? this.instantiate(r.component, void 0)
        } else {
          instance = r.component
        }
        if (instance) {
          results.push(instance)
        }
      } catch {}
    }
    return results
  }
  findCachedInstance(constructor) {
    const ctorId = constructor.__cacheId
    if (!ctorId) return void 0
    for (const [key, instance] of this.instanceCache) {
      if (key.startsWith(`${ctorId}:`)) return instance
    }
    return void 0
  }
}
var componentRegistry = new ComponentRegistry()

// ../../util/resources.tsx
import { jsx } from "preact/jsx-runtime"
function concatenateResources(...resources) {
  return resources.filter((resource) => resource !== void 0).flat()
}

// ../../util/path.ts
import {
  isFilePath,
  isFullSlug,
  isSimpleSlug,
  isRelativeURL,
  isAbsoluteURL,
  getFullSlug,
  slugifyFilePath,
  simplifySlug,
  joinSegments,
  endsWith,
  trimSuffix,
  stripSlashes,
  getFileExtension,
  isFolderPath,
  getAllSegmentPrefixes,
  pathToRoot,
  resolveRelative,
  splitAnchor,
  slugTag,
  transformInternalLink,
  transformLink,
  normalizeHastElement,
} from "@quartz-community/utils"

// ../components/HeaderMenu.tsx
import { jsx as jsx2 } from "preact/jsx-runtime"
function getSlugSegments(slug) {
  const simpleSlug = simplifySlug(slug)
  if (simpleSlug === "/" || simpleSlug.length === 0) {
    return []
  }
  return simpleSlug.split("/")
}
function getTopLevelSegment(slug) {
  return getSlugSegments(slug)[0]
}
function formatMenuLabel(label) {
  const normalized = label
    .replace(/^\d+[-_\s]*/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return normalized.length > 0 ? normalized : label
}
function getItemRank(rawSlug, segments) {
  const isFolderIndex = rawSlug.endsWith("/index")
  const isRootFile = segments.length === 1 && !isFolderIndex
  if (isFolderIndex) return 0
  if (isRootFile) return 1
  return 2
}
var HeaderMenu = ({ allFiles, fileData }) => {
  if (allFiles.length === 0 || !fileData.slug) {
    return null
  }
  const currentTopLevel = getTopLevelSegment(fileData.slug)
  const itemsByKey = /* @__PURE__ */ new Map()
  for (const file of allFiles) {
    if (!file.slug) continue
    const rawSlug = file.slug
    const segments = getSlugSegments(rawSlug)
    const key = segments[0]
    if (!key || key === "tags" || key === "404") continue
    const rank = getItemRank(rawSlug, segments)
    const isFolder = rank !== 1
    const existing = itemsByKey.get(key)
    if (existing && existing.rank <= rank) continue
    itemsByKey.set(key, {
      key,
      slug: isFolder ? `${key}/index` : rawSlug,
      label: formatMenuLabel(file.frontmatter?.title ?? key),
      isFolder,
      rank,
    })
  }
  const items = [...itemsByKey.values()].sort((a, b) => {
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1
    return a.label.localeCompare(b.label, void 0, {
      numeric: true,
      sensitivity: "base",
    })
  })
  if (items.length === 0) {
    return null
  }
  return /* @__PURE__ */ jsx2("nav", {
    class: "header-menu",
    "aria-label": "Top level sections",
    children: /* @__PURE__ */ jsx2("ul", {
      class: "header-menu-list",
      children: items.map((item) => {
        const topLevel = getTopLevelSegment(item.slug)
        const isActive = topLevel !== void 0 && topLevel === currentTopLevel
        return /* @__PURE__ */ jsx2("li", {
          class: "header-menu-item",
          children: /* @__PURE__ */ jsx2("a", {
            class: isActive ? "active" : void 0,
            href: resolveRelative(fileData.slug, item.slug),
            children: item.label,
          }),
        })
      }),
    }),
  })
}
HeaderMenu.css = `
.header-menu {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.header-menu-list {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem 0.95rem;
  list-style: none;
  margin: 0;
  padding: 0;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}

.header-menu-list::-webkit-scrollbar {
  display: none;
}

.header-menu-item {
  flex: 0 0 auto;
}

.header-menu-item > a {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0;
  color: var(--darkgray);
  font-family: var(--headerFont);
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0.78;
}

.header-menu-item > a.active {
  color: var(--dark);
  opacity: 1;
}

.header-menu-item > a.active::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.55rem;
  height: 2px;
  background: linear-gradient(90deg, var(--secondary), var(--tertiary));
  border-radius: 999px;
}

@media all and (max-width: 800px) {
  .header-menu {
    overflow-x: auto;
  }

  .header-menu-list {
    justify-content: flex-start;
  }
}
`
var HeaderMenu_default = () => HeaderMenu

// ../../i18n/locales/en-US.ts
var en_US_default = {
  propertyDefaults: {
    title: "Untitled",
    description: "No description provided",
  },
  components: {
    callout: {
      note: "Note",
      abstract: "Abstract",
      info: "Info",
      todo: "Todo",
      tip: "Tip",
      success: "Success",
      question: "Question",
      warning: "Warning",
      failure: "Failure",
      danger: "Danger",
      bug: "Bug",
      example: "Example",
      quote: "Quote",
    },
    backlinks: {
      title: "Backlinks",
      noBacklinksFound: "No backlinks found",
    },
    themeToggle: {
      lightMode: "Light mode",
      darkMode: "Dark mode",
    },
    readerMode: {
      title: "Reader mode",
    },
    explorer: {
      title: "Explorer",
    },
    footer: {
      createdWith: "Created with",
    },
    graph: {
      title: "Graph View",
    },
    recentNotes: {
      title: "Recent Notes",
      seeRemainingMore: ({ remaining }) => `See ${remaining} more \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `Transclude of ${targetSlug}`,
      linkToOriginal: "Link to original",
    },
    search: {
      title: "Search",
      searchBarPlaceholder: "Search for something",
    },
    tableOfContents: {
      title: "Table of Contents",
    },
    contentMeta: {
      readingTime: ({ minutes }) => `${minutes} min read`,
    },
  },
  pages: {
    rss: {
      recentNotes: "Recent notes",
      lastFewNotes: ({ count }) => `Last ${count} notes`,
    },
    error: {
      title: "Not Found",
      notFound: "Either this page is private or doesn't exist.",
      home: "Return to Homepage",
    },
    folderContent: {
      folder: "Folder",
      itemsUnderFolder: ({ count }) =>
        count === 1 ? "1 item under this folder." : `${count} items under this folder.`,
    },
    tagContent: {
      tag: "Tag",
      tagIndex: "Tag Index",
      itemsUnderTag: ({ count }) =>
        count === 1 ? "1 item with this tag." : `${count} items with this tag.`,
      showingFirst: ({ count }) => `Showing first ${count} tags.`,
      totalTags: ({ count }) => `Found ${count} total tags.`,
    },
  },
}

// ../../i18n/locales/en-GB.ts
var en_GB_default = {
  propertyDefaults: {
    title: "Untitled",
    description: "No description provided",
  },
  components: {
    callout: {
      note: "Note",
      abstract: "Abstract",
      info: "Info",
      todo: "To-Do",
      tip: "Tip",
      success: "Success",
      question: "Question",
      warning: "Warning",
      failure: "Failure",
      danger: "Danger",
      bug: "Bug",
      example: "Example",
      quote: "Quote",
    },
    backlinks: {
      title: "Backlinks",
      noBacklinksFound: "No backlinks found",
    },
    themeToggle: {
      lightMode: "Light mode",
      darkMode: "Dark mode",
    },
    readerMode: {
      title: "Reader mode",
    },
    explorer: {
      title: "Explorer",
    },
    footer: {
      createdWith: "Created with",
    },
    graph: {
      title: "Graph View",
    },
    recentNotes: {
      title: "Recent Notes",
      seeRemainingMore: ({ remaining }) => `See ${remaining} more \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `Transclude of ${targetSlug}`,
      linkToOriginal: "Link to original",
    },
    search: {
      title: "Search",
      searchBarPlaceholder: "Search for something",
    },
    tableOfContents: {
      title: "Table of Contents",
    },
    contentMeta: {
      readingTime: ({ minutes }) => `${minutes} min read`,
    },
  },
  pages: {
    rss: {
      recentNotes: "Recent notes",
      lastFewNotes: ({ count }) => `Last ${count} notes`,
    },
    error: {
      title: "Not Found",
      notFound: "Either this page is private or doesn't exist.",
      home: "Return to Homepage",
    },
    folderContent: {
      folder: "Folder",
      itemsUnderFolder: ({ count }) =>
        count === 1 ? "1 item under this folder." : `${count} items under this folder.`,
    },
    tagContent: {
      tag: "Tag",
      tagIndex: "Tag Index",
      itemsUnderTag: ({ count }) =>
        count === 1 ? "1 item with this tag." : `${count} items with this tag.`,
      showingFirst: ({ count }) => `Showing first ${count} tags.`,
      totalTags: ({ count }) => `Found ${count} total tags.`,
    },
  },
}

// ../../i18n/locales/fr-FR.ts
var fr_FR_default = {
  propertyDefaults: {
    title: "Sans titre",
    description: "Aucune description fournie",
  },
  components: {
    callout: {
      note: "Note",
      abstract: "R\xE9sum\xE9",
      info: "Info",
      todo: "\xC0 faire",
      tip: "Conseil",
      success: "Succ\xE8s",
      question: "Question",
      warning: "Avertissement",
      failure: "\xC9chec",
      danger: "Danger",
      bug: "Bogue",
      example: "Exemple",
      quote: "Citation",
    },
    backlinks: {
      title: "Liens retour",
      noBacklinksFound: "Aucun lien retour trouv\xE9",
    },
    themeToggle: {
      lightMode: "Mode clair",
      darkMode: "Mode sombre",
    },
    readerMode: {
      title: "Mode lecture",
    },
    explorer: {
      title: "Explorateur",
    },
    footer: {
      createdWith: "Cr\xE9\xE9 avec",
    },
    graph: {
      title: "Vue Graphique",
    },
    recentNotes: {
      title: "Notes R\xE9centes",
      seeRemainingMore: ({ remaining }) => `Voir ${remaining} de plus \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `Transclusion de ${targetSlug}`,
      linkToOriginal: "Lien vers l'original",
    },
    search: {
      title: "Recherche",
      searchBarPlaceholder: "Rechercher quelque chose",
    },
    tableOfContents: {
      title: "Table des Mati\xE8res",
    },
    contentMeta: {
      readingTime: ({ minutes }) => `${minutes} min de lecture`,
    },
  },
  pages: {
    rss: {
      recentNotes: "Notes r\xE9centes",
      lastFewNotes: ({ count }) => `Les derni\xE8res ${count} notes`,
    },
    error: {
      title: "Introuvable",
      notFound: "Cette page est soit priv\xE9e, soit elle n'existe pas.",
      home: "Retour \xE0 la page d'accueil",
    },
    folderContent: {
      folder: "Dossier",
      itemsUnderFolder: ({ count }) =>
        count === 1
          ? "1 \xE9l\xE9ment sous ce dossier."
          : `${count} \xE9l\xE9ments sous ce dossier.`,
    },
    tagContent: {
      tag: "\xC9tiquette",
      tagIndex: "Index des \xE9tiquettes",
      itemsUnderTag: ({ count }) =>
        count === 1
          ? "1 \xE9l\xE9ment avec cette \xE9tiquette."
          : `${count} \xE9l\xE9ments avec cette \xE9tiquette.`,
      showingFirst: ({ count }) => `Affichage des premi\xE8res ${count} \xE9tiquettes.`,
      totalTags: ({ count }) => `Trouv\xE9 ${count} \xE9tiquettes au total.`,
    },
  },
}

// ../../i18n/locales/it-IT.ts
var it_IT_default = {
  propertyDefaults: {
    title: "Senza titolo",
    description: "Nessuna descrizione",
  },
  components: {
    callout: {
      note: "Nota",
      abstract: "Abstract",
      info: "Info",
      todo: "Da fare",
      tip: "Consiglio",
      success: "Completato",
      question: "Domanda",
      warning: "Attenzione",
      failure: "Errore",
      danger: "Pericolo",
      bug: "Problema",
      example: "Esempio",
      quote: "Citazione",
    },
    backlinks: {
      title: "Link entranti",
      noBacklinksFound: "Nessun link entrante",
    },
    themeToggle: {
      lightMode: "Tema chiaro",
      darkMode: "Tema scuro",
    },
    readerMode: {
      title: "Modalit\xE0 lettura",
    },
    explorer: {
      title: "Esplora",
    },
    footer: {
      createdWith: "Creato con",
    },
    graph: {
      title: "Vista grafico",
    },
    recentNotes: {
      title: "Note recenti",
      seeRemainingMore: ({ remaining }) =>
        remaining === 1 ? "Vedi 1 altra \u2192" : `Vedi altre ${remaining} \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `Inclusione di ${targetSlug}`,
      linkToOriginal: "Link all'originale",
    },
    search: {
      title: "Cerca",
      searchBarPlaceholder: "Cerca qualcosa",
    },
    tableOfContents: {
      title: "Indice",
    },
    contentMeta: {
      readingTime: ({ minutes }) => (minutes === 1 ? "1 minuto" : `${minutes} minuti`),
    },
  },
  pages: {
    rss: {
      recentNotes: "Note recenti",
      lastFewNotes: ({ count }) => (count === 1 ? "Ultima nota" : `Ultime ${count} note`),
    },
    error: {
      title: "Non trovato",
      notFound: "Questa pagina \xE8 privata o non esiste.",
      home: "Ritorna alla home page",
    },
    folderContent: {
      folder: "Cartella",
      itemsUnderFolder: ({ count }) =>
        count === 1 ? "1 oggetto in questa cartella." : `${count} oggetti in questa cartella.`,
    },
    tagContent: {
      tag: "Etichetta",
      tagIndex: "Indice etichette",
      itemsUnderTag: ({ count }) =>
        count === 1 ? "1 oggetto con questa etichetta." : `${count} oggetti con questa etichetta.`,
      showingFirst: ({ count }) => (count === 1 ? "Prima etichetta." : `Prime ${count} etichette.`),
      totalTags: ({ count }) =>
        count === 1 ? "Trovata 1 etichetta in totale." : `Trovate ${count} etichette totali.`,
    },
  },
}

// ../../i18n/locales/ja-JP.ts
var ja_JP_default = {
  propertyDefaults: {
    title: "\u7121\u984C",
    description: "\u8AAC\u660E\u306A\u3057",
  },
  components: {
    callout: {
      note: "\u30CE\u30FC\u30C8",
      abstract: "\u6284\u9332",
      info: "\u60C5\u5831",
      todo: "\u3084\u308B\u3079\u304D\u3053\u3068",
      tip: "\u30D2\u30F3\u30C8",
      success: "\u6210\u529F",
      question: "\u8CEA\u554F",
      warning: "\u8B66\u544A",
      failure: "\u5931\u6557",
      danger: "\u5371\u967A",
      bug: "\u30D0\u30B0",
      example: "\u4F8B",
      quote: "\u5F15\u7528",
    },
    backlinks: {
      title: "\u30D0\u30C3\u30AF\u30EA\u30F3\u30AF",
      noBacklinksFound: "\u30D0\u30C3\u30AF\u30EA\u30F3\u30AF\u306F\u3042\u308A\u307E\u305B\u3093",
    },
    themeToggle: {
      lightMode: "\u30E9\u30A4\u30C8\u30E2\u30FC\u30C9",
      darkMode: "\u30C0\u30FC\u30AF\u30E2\u30FC\u30C9",
    },
    readerMode: {
      title: "\u30EA\u30FC\u30C0\u30FC\u30E2\u30FC\u30C9",
    },
    explorer: {
      title: "\u30A8\u30AF\u30B9\u30D7\u30ED\u30FC\u30E9\u30FC",
    },
    footer: {
      createdWith: "\u4F5C\u6210",
    },
    graph: {
      title: "\u30B0\u30E9\u30D5\u30D3\u30E5\u30FC",
    },
    recentNotes: {
      title: "\u6700\u8FD1\u306E\u8A18\u4E8B",
      seeRemainingMore: ({ remaining }) => `\u3055\u3089\u306B${remaining}\u4EF6 \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `${targetSlug}\u306E\u307E\u3068\u3081`,
      linkToOriginal: "\u5143\u8A18\u4E8B\u3078\u306E\u30EA\u30F3\u30AF",
    },
    search: {
      title: "\u691C\u7D22",
      searchBarPlaceholder: "\u691C\u7D22\u30EF\u30FC\u30C9\u3092\u5165\u529B",
    },
    tableOfContents: {
      title: "\u76EE\u6B21",
    },
    contentMeta: {
      readingTime: ({ minutes }) => `${minutes} min read`,
    },
  },
  pages: {
    rss: {
      recentNotes: "\u6700\u8FD1\u306E\u8A18\u4E8B",
      lastFewNotes: ({ count }) => `\u6700\u65B0\u306E${count}\u4EF6`,
    },
    error: {
      title: "Not Found",
      notFound:
        "\u30DA\u30FC\u30B8\u304C\u5B58\u5728\u3057\u306A\u3044\u304B\u3001\u975E\u516C\u958B\u8A2D\u5B9A\u306B\u306A\u3063\u3066\u3044\u307E\u3059\u3002",
      home: "\u30DB\u30FC\u30E0\u30DA\u30FC\u30B8\u306B\u623B\u308B",
    },
    folderContent: {
      folder: "\u30D5\u30A9\u30EB\u30C0",
      itemsUnderFolder: ({ count }) => `${count}\u4EF6\u306E\u30DA\u30FC\u30B8`,
    },
    tagContent: {
      tag: "\u30BF\u30B0",
      tagIndex: "\u30BF\u30B0\u4E00\u89A7",
      itemsUnderTag: ({ count }) => `${count}\u4EF6\u306E\u30DA\u30FC\u30B8`,
      showingFirst: ({ count }) =>
        `\u306E\u3046\u3061\u6700\u521D\u306E${count}\u4EF6\u3092\u8868\u793A\u3057\u3066\u3044\u307E\u3059`,
      totalTags: ({ count }) => `\u5168${count}\u500B\u306E\u30BF\u30B0\u3092\u8868\u793A\u4E2D`,
    },
  },
}

// ../../i18n/locales/de-DE.ts
var de_DE_default = {
  propertyDefaults: {
    title: "Unbenannt",
    description: "Keine Beschreibung angegeben",
  },
  components: {
    callout: {
      note: "Hinweis",
      abstract: "Zusammenfassung",
      info: "Info",
      todo: "Zu erledigen",
      tip: "Tipp",
      success: "Erfolg",
      question: "Frage",
      warning: "Warnung",
      failure: "Fehlgeschlagen",
      danger: "Gefahr",
      bug: "Fehler",
      example: "Beispiel",
      quote: "Zitat",
    },
    backlinks: {
      title: "Backlinks",
      noBacklinksFound: "Keine Backlinks gefunden",
    },
    themeToggle: {
      lightMode: "Heller Modus",
      darkMode: "Dunkler Modus",
    },
    readerMode: {
      title: "Lesemodus",
    },
    explorer: {
      title: "Explorer",
    },
    footer: {
      createdWith: "Erstellt mit",
    },
    graph: {
      title: "Graphansicht",
    },
    recentNotes: {
      title: "Zuletzt bearbeitete Seiten",
      seeRemainingMore: ({ remaining }) => `${remaining} weitere ansehen \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `Transklusion von ${targetSlug}`,
      linkToOriginal: "Link zum Original",
    },
    search: {
      title: "Suche",
      searchBarPlaceholder: "Suche nach etwas",
    },
    tableOfContents: {
      title: "Inhaltsverzeichnis",
    },
    contentMeta: {
      readingTime: ({ minutes }) => `${minutes} Min. Lesezeit`,
    },
  },
  pages: {
    rss: {
      recentNotes: "Zuletzt bearbeitete Seiten",
      lastFewNotes: ({ count }) => `Letzte ${count} Seiten`,
    },
    error: {
      title: "Nicht gefunden",
      notFound: "Diese Seite ist entweder nicht \xF6ffentlich oder existiert nicht.",
      home: "Zur Startseite",
    },
    folderContent: {
      folder: "Ordner",
      itemsUnderFolder: ({ count }) =>
        count === 1 ? "1 Datei in diesem Ordner." : `${count} Dateien in diesem Ordner.`,
    },
    tagContent: {
      tag: "Tag",
      tagIndex: "Tag-\xDCbersicht",
      itemsUnderTag: ({ count }) =>
        count === 1 ? "1 Datei mit diesem Tag." : `${count} Dateien mit diesem Tag.`,
      showingFirst: ({ count }) => `Die ersten ${count} Tags werden angezeigt.`,
      totalTags: ({ count }) => `${count} Tags insgesamt.`,
    },
  },
}

// ../../i18n/locales/nl-NL.ts
var nl_NL_default = {
  propertyDefaults: {
    title: "Naamloos",
    description: "Geen beschrijving gegeven.",
  },
  components: {
    callout: {
      note: "Notitie",
      abstract: "Samenvatting",
      info: "Info",
      todo: "Te doen",
      tip: "Tip",
      success: "Succes",
      question: "Vraag",
      warning: "Waarschuwing",
      failure: "Mislukking",
      danger: "Gevaar",
      bug: "Bug",
      example: "Voorbeeld",
      quote: "Citaat",
    },
    backlinks: {
      title: "Backlinks",
      noBacklinksFound: "Geen backlinks gevonden",
    },
    themeToggle: {
      lightMode: "Lichte modus",
      darkMode: "Donkere modus",
    },
    readerMode: {
      title: "Leesmodus",
    },
    explorer: {
      title: "Verkenner",
    },
    footer: {
      createdWith: "Gemaakt met",
    },
    graph: {
      title: "Grafiekweergave",
    },
    recentNotes: {
      title: "Recente notities",
      seeRemainingMore: ({ remaining }) => `Zie ${remaining} meer \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `Invoeging van ${targetSlug}`,
      linkToOriginal: "Link naar origineel",
    },
    search: {
      title: "Zoeken",
      searchBarPlaceholder: "Doorzoek de website",
    },
    tableOfContents: {
      title: "Inhoudsopgave",
    },
    contentMeta: {
      readingTime: ({ minutes }) =>
        minutes === 1 ? "1 minuut leestijd" : `${minutes} minuten leestijd`,
    },
  },
  pages: {
    rss: {
      recentNotes: "Recente notities",
      lastFewNotes: ({ count }) => `Laatste ${count} notities`,
    },
    error: {
      title: "Niet gevonden",
      notFound: "Deze pagina is niet zichtbaar of bestaat niet.",
      home: "Keer terug naar de start pagina",
    },
    folderContent: {
      folder: "Map",
      itemsUnderFolder: ({ count }) =>
        count === 1 ? "1 item in deze map." : `${count} items in deze map.`,
    },
    tagContent: {
      tag: "Label",
      tagIndex: "Label-index",
      itemsUnderTag: ({ count }) =>
        count === 1 ? "1 item met dit label." : `${count} items met dit label.`,
      showingFirst: ({ count }) =>
        count === 1 ? "Eerste label tonen." : `Eerste ${count} labels tonen.`,
      totalTags: ({ count }) => `${count} labels gevonden.`,
    },
  },
}

// ../../i18n/locales/ro-RO.ts
var ro_RO_default = {
  propertyDefaults: {
    title: "F\u0103r\u0103 titlu",
    description: "Nici o descriere furnizat\u0103",
  },
  components: {
    callout: {
      note: "Not\u0103",
      abstract: "Rezumat",
      info: "Informa\u021Bie",
      todo: "De f\u0103cut",
      tip: "Sfat",
      success: "Succes",
      question: "\xCEntrebare",
      warning: "Avertisment",
      failure: "E\u0219ec",
      danger: "Pericol",
      bug: "Bug",
      example: "Exemplu",
      quote: "Citat",
    },
    backlinks: {
      title: "Leg\u0103turi \xEEnapoi",
      noBacklinksFound: "Nu s-au g\u0103sit leg\u0103turi \xEEnapoi",
    },
    themeToggle: {
      lightMode: "Modul luminos",
      darkMode: "Modul \xEEntunecat",
    },
    readerMode: {
      title: "Modul de citire",
    },
    explorer: {
      title: "Explorator",
    },
    footer: {
      createdWith: "Creat cu",
    },
    graph: {
      title: "Graf",
    },
    recentNotes: {
      title: "Noti\u021Be recente",
      seeRemainingMore: ({ remaining }) => `Vezi \xEEnc\u0103 ${remaining} \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `Extras din ${targetSlug}`,
      linkToOriginal: "Leg\u0103tur\u0103 c\u0103tre original",
    },
    search: {
      title: "C\u0103utare",
      searchBarPlaceholder: "Introduce\u021Bi termenul de c\u0103utare...",
    },
    tableOfContents: {
      title: "Cuprins",
    },
    contentMeta: {
      readingTime: ({ minutes }) =>
        minutes == 1 ? `lectur\u0103 de 1 minut` : `lectur\u0103 de ${minutes} minute`,
    },
  },
  pages: {
    rss: {
      recentNotes: "Noti\u021Be recente",
      lastFewNotes: ({ count }) => `Ultimele ${count} noti\u021Be`,
    },
    error: {
      title: "Pagina nu a fost g\u0103sit\u0103",
      notFound: "Fie aceast\u0103 pagin\u0103 este privat\u0103, fie nu exist\u0103.",
      home: "Reveni\u021Bi la pagina de pornire",
    },
    folderContent: {
      folder: "Dosar",
      itemsUnderFolder: ({ count }) =>
        count === 1 ? "1 articol \xEEn acest dosar." : `${count} elemente \xEEn acest dosar.`,
    },
    tagContent: {
      tag: "Etichet\u0103",
      tagIndex: "Indexul etichetelor",
      itemsUnderTag: ({ count }) =>
        count === 1
          ? "1 articol cu aceast\u0103 etichet\u0103."
          : `${count} articole cu aceast\u0103 etichet\u0103.`,
      showingFirst: ({ count }) => `Se afi\u0219eaz\u0103 primele ${count} etichete.`,
      totalTags: ({ count }) => `Au fost g\u0103site ${count} etichete \xEEn total.`,
    },
  },
}

// ../../i18n/locales/ca-ES.ts
var ca_ES_default = {
  propertyDefaults: {
    title: "Sense t\xEDtol",
    description: "Sense descripci\xF3",
  },
  components: {
    callout: {
      note: "Nota",
      abstract: "Resum",
      info: "Informaci\xF3",
      todo: "Per fer",
      tip: "Consell",
      success: "\xC8xit",
      question: "Pregunta",
      warning: "Advert\xE8ncia",
      failure: "Fall",
      danger: "Perill",
      bug: "Error",
      example: "Exemple",
      quote: "Cita",
    },
    backlinks: {
      title: "Retroenlla\xE7",
      noBacklinksFound: "No s'han trobat retroenlla\xE7os",
    },
    themeToggle: {
      lightMode: "Mode clar",
      darkMode: "Mode fosc",
    },
    readerMode: {
      title: "Mode lector",
    },
    explorer: {
      title: "Explorador",
    },
    footer: {
      createdWith: "Creat amb",
    },
    graph: {
      title: "Vista Gr\xE0fica",
    },
    recentNotes: {
      title: "Notes Recents",
      seeRemainingMore: ({ remaining }) => `Vegi ${remaining} m\xE9s \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `Transcluit de ${targetSlug}`,
      linkToOriginal: "Enlla\xE7 a l'original",
    },
    search: {
      title: "Cercar",
      searchBarPlaceholder: "Cerca alguna cosa",
    },
    tableOfContents: {
      title: "Taula de Continguts",
    },
    contentMeta: {
      readingTime: ({ minutes }) => `Es llegeix en ${minutes} min`,
    },
  },
  pages: {
    rss: {
      recentNotes: "Notes recents",
      lastFewNotes: ({ count }) => `\xDAltimes ${count} notes`,
    },
    error: {
      title: "No s'ha trobat.",
      notFound: "Aquesta p\xE0gina \xE9s privada o no existeix.",
      home: "Torna a la p\xE0gina principal",
    },
    folderContent: {
      folder: "Carpeta",
      itemsUnderFolder: ({ count }) =>
        count === 1 ? "1 article en aquesta carpeta." : `${count} articles en esta carpeta.`,
    },
    tagContent: {
      tag: "Etiqueta",
      tagIndex: "\xEDndex d'Etiquetes",
      itemsUnderTag: ({ count }) =>
        count === 1 ? "1 article amb aquesta etiqueta." : `${count} article amb aquesta etiqueta.`,
      showingFirst: ({ count }) => `Mostrant les primeres ${count} etiquetes.`,
      totalTags: ({ count }) => `S'han trobat ${count} etiquetes en total.`,
    },
  },
}

// ../../i18n/locales/es-ES.ts
var es_ES_default = {
  propertyDefaults: {
    title: "Sin t\xEDtulo",
    description: "Sin descripci\xF3n",
  },
  components: {
    callout: {
      note: "Nota",
      abstract: "Resumen",
      info: "Informaci\xF3n",
      todo: "Por hacer",
      tip: "Consejo",
      success: "\xC9xito",
      question: "Pregunta",
      warning: "Advertencia",
      failure: "Fallo",
      danger: "Peligro",
      bug: "Error",
      example: "Ejemplo",
      quote: "Cita",
    },
    backlinks: {
      title: "Retroenlaces",
      noBacklinksFound: "No se han encontrado retroenlaces",
    },
    themeToggle: {
      lightMode: "Modo claro",
      darkMode: "Modo oscuro",
    },
    readerMode: {
      title: "Modo lector",
    },
    explorer: {
      title: "Explorador",
    },
    footer: {
      createdWith: "Creado con",
    },
    graph: {
      title: "Vista Gr\xE1fica",
    },
    recentNotes: {
      title: "Notas Recientes",
      seeRemainingMore: ({ remaining }) => `Vea ${remaining} m\xE1s \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `Transcluido de ${targetSlug}`,
      linkToOriginal: "Enlace al original",
    },
    search: {
      title: "Buscar",
      searchBarPlaceholder: "Busca algo",
    },
    tableOfContents: {
      title: "Tabla de Contenidos",
    },
    contentMeta: {
      readingTime: ({ minutes }) => `Se lee en ${minutes} min`,
    },
  },
  pages: {
    rss: {
      recentNotes: "Notas recientes",
      lastFewNotes: ({ count }) => `\xDAltimas ${count} notas`,
    },
    error: {
      title: "No se ha encontrado.",
      notFound: "Esta p\xE1gina es privada o no existe.",
      home: "Regresa a la p\xE1gina principal",
    },
    folderContent: {
      folder: "Carpeta",
      itemsUnderFolder: ({ count }) =>
        count === 1 ? "1 art\xEDculo en esta carpeta." : `${count} art\xEDculos en esta carpeta.`,
    },
    tagContent: {
      tag: "Etiqueta",
      tagIndex: "\xCDndice de Etiquetas",
      itemsUnderTag: ({ count }) =>
        count === 1
          ? "1 art\xEDculo con esta etiqueta."
          : `${count} art\xEDculos con esta etiqueta.`,
      showingFirst: ({ count }) => `Mostrando las primeras ${count} etiquetas.`,
      totalTags: ({ count }) => `Se han encontrado ${count} etiquetas en total.`,
    },
  },
}

// ../../i18n/locales/ar-SA.ts
var ar_SA_default = {
  propertyDefaults: {
    title: "\u063A\u064A\u0631 \u0645\u0639\u0646\u0648\u0646",
    description:
      "\u0644\u0645 \u064A\u062A\u0645 \u062A\u0642\u062F\u064A\u0645 \u0623\u064A \u0648\u0635\u0641",
  },
  direction: "rtl",
  components: {
    callout: {
      note: "\u0645\u0644\u0627\u062D\u0638\u0629",
      abstract: "\u0645\u0644\u062E\u0635",
      info: "\u0645\u0639\u0644\u0648\u0645\u0627\u062A",
      todo: "\u0644\u0644\u0642\u064A\u0627\u0645",
      tip: "\u0646\u0635\u064A\u062D\u0629",
      success: "\u0646\u062C\u0627\u062D",
      question: "\u0633\u0624\u0627\u0644",
      warning: "\u062A\u062D\u0630\u064A\u0631",
      failure: "\u0641\u0634\u0644",
      danger: "\u062E\u0637\u0631",
      bug: "\u062E\u0644\u0644",
      example: "\u0645\u062B\u0627\u0644",
      quote: "\u0627\u0642\u062A\u0628\u0627\u0633",
    },
    backlinks: {
      title: "\u0648\u0635\u0644\u0627\u062A \u0627\u0644\u0639\u0648\u062F\u0629",
      noBacklinksFound:
        "\u0644\u0627 \u064A\u0648\u062C\u062F \u0648\u0635\u0644\u0627\u062A \u0639\u0648\u062F\u0629",
    },
    themeToggle: {
      lightMode: "\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0646\u0647\u0627\u0631\u064A",
      darkMode: "\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0644\u064A\u0644\u064A",
    },
    explorer: {
      title: "\u0627\u0644\u0645\u0633\u062A\u0639\u0631\u0636",
    },
    readerMode: {
      title: "\u0648\u0636\u0639 \u0627\u0644\u0642\u0627\u0631\u0626",
    },
    footer: {
      createdWith:
        "\u0623\u064F\u0646\u0634\u0626 \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645",
    },
    graph: {
      title:
        "\u0627\u0644\u062A\u0645\u062B\u064A\u0644 \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A",
    },
    recentNotes: {
      title: "\u0622\u062E\u0631 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A",
      seeRemainingMore: ({ remaining }) =>
        `\u062A\u0635\u0641\u062D ${remaining} \u0623\u0643\u062B\u0631 \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `\u0645\u0642\u062A\u0628\u0633 \u0645\u0646 ${targetSlug}`,
      linkToOriginal:
        "\u0648\u0635\u0644\u0629 \u0644\u0644\u0645\u0644\u0627\u062D\u0638\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u0629",
    },
    search: {
      title: "\u0628\u062D\u062B",
      searchBarPlaceholder: "\u0627\u0628\u062D\u062B \u0639\u0646 \u0634\u064A\u0621 \u0645\u0627",
    },
    tableOfContents: {
      title: "\u0641\u0647\u0631\u0633 \u0627\u0644\u0645\u062D\u062A\u0648\u064A\u0627\u062A",
    },
    contentMeta: {
      readingTime: ({ minutes }) =>
        minutes == 1
          ? `\u062F\u0642\u064A\u0642\u0629 \u0623\u0648 \u0623\u0642\u0644 \u0644\u0644\u0642\u0631\u0627\u0621\u0629`
          : minutes == 2
            ? `\u062F\u0642\u064A\u0642\u062A\u0627\u0646 \u0644\u0644\u0642\u0631\u0627\u0621\u0629`
            : `${minutes} \u062F\u0642\u0627\u0626\u0642 \u0644\u0644\u0642\u0631\u0627\u0621\u0629`,
    },
  },
  pages: {
    rss: {
      recentNotes: "\u0622\u062E\u0631 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A",
      lastFewNotes: ({ count }) =>
        `\u0622\u062E\u0631 ${count} \u0645\u0644\u0627\u062D\u0638\u0629`,
    },
    error: {
      title: "\u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F",
      notFound:
        "\u0625\u0645\u0627 \u0623\u0646 \u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062D\u0629 \u062E\u0627\u0635\u0629 \u0623\u0648 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629.",
      home: "\u0627\u0644\u0639\u0648\u062F\u0647 \u0644\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
    },
    folderContent: {
      folder: "\u0645\u062C\u0644\u062F",
      itemsUnderFolder: ({ count }) =>
        count === 1
          ? "\u064A\u0648\u062C\u062F \u0639\u0646\u0635\u0631 \u0648\u0627\u062D\u062F \u0641\u0642\u0637 \u062A\u062D\u062A \u0647\u0630\u0627 \u0627\u0644\u0645\u062C\u0644\u062F"
          : `\u064A\u0648\u062C\u062F ${count} \u0639\u0646\u0627\u0635\u0631 \u062A\u062D\u062A \u0647\u0630\u0627 \u0627\u0644\u0645\u062C\u0644\u062F.`,
    },
    tagContent: {
      tag: "\u0627\u0644\u0648\u0633\u0645",
      tagIndex: "\u0645\u0624\u0634\u0631 \u0627\u0644\u0648\u0633\u0645",
      itemsUnderTag: ({ count }) =>
        count === 1
          ? "\u064A\u0648\u062C\u062F \u0639\u0646\u0635\u0631 \u0648\u0627\u062D\u062F \u0641\u0642\u0637 \u062A\u062D\u062A \u0647\u0630\u0627 \u0627\u0644\u0648\u0633\u0645"
          : `\u064A\u0648\u062C\u062F ${count} \u0639\u0646\u0627\u0635\u0631 \u062A\u062D\u062A \u0647\u0630\u0627 \u0627\u0644\u0648\u0633\u0645.`,
      showingFirst: ({ count }) =>
        `\u0625\u0638\u0647\u0627\u0631 \u0623\u0648\u0644 ${count} \u0623\u0648\u0633\u0645\u0629.`,
      totalTags: ({ count }) => `\u064A\u0648\u062C\u062F ${count} \u0623\u0648\u0633\u0645\u0629.`,
    },
  },
}

// ../../i18n/locales/uk-UA.ts
var uk_UA_default = {
  propertyDefaults: {
    title: "\u0411\u0435\u0437 \u043D\u0430\u0437\u0432\u0438",
    description: "\u041E\u043F\u0438\u0441 \u043D\u0435 \u043D\u0430\u0434\u0430\u043D\u043E",
  },
  components: {
    callout: {
      note: "\u041F\u0440\u0438\u043C\u0456\u0442\u043A\u0430",
      abstract: "\u0410\u0431\u0441\u0442\u0440\u0430\u043A\u0442",
      info: "\u0406\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0456\u044F",
      todo: "\u0417\u0430\u0432\u0434\u0430\u043D\u043D\u044F",
      tip: "\u041F\u043E\u0440\u0430\u0434\u0430",
      success: "\u0423\u0441\u043F\u0456\u0445",
      question: "\u041F\u0438\u0442\u0430\u043D\u043D\u044F",
      warning: "\u041F\u043E\u043F\u0435\u0440\u0435\u0434\u0436\u0435\u043D\u043D\u044F",
      failure: "\u041D\u0435\u0432\u0434\u0430\u0447\u0430",
      danger: "\u041D\u0435\u0431\u0435\u0437\u043F\u0435\u043A\u0430",
      bug: "\u0411\u0430\u0433",
      example: "\u041F\u0440\u0438\u043A\u043B\u0430\u0434",
      quote: "\u0426\u0438\u0442\u0430\u0442\u0430",
    },
    backlinks: {
      title:
        "\u0417\u0432\u043E\u0440\u043E\u0442\u043D\u0456 \u043F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F",
      noBacklinksFound:
        "\u0417\u0432\u043E\u0440\u043E\u0442\u043D\u0438\u0445 \u043F\u043E\u0441\u0438\u043B\u0430\u043D\u044C \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E",
    },
    themeToggle: {
      lightMode: "\u0421\u0432\u0456\u0442\u043B\u0438\u0439 \u0440\u0435\u0436\u0438\u043C",
      darkMode: "\u0422\u0435\u043C\u043D\u0438\u0439 \u0440\u0435\u0436\u0438\u043C",
    },
    readerMode: {
      title: "\u0420\u0435\u0436\u0438\u043C \u0447\u0438\u0442\u0430\u043D\u043D\u044F",
    },
    explorer: {
      title: "\u041F\u0440\u043E\u0432\u0456\u0434\u043D\u0438\u043A",
    },
    footer: {
      createdWith:
        "\u0421\u0442\u0432\u043E\u0440\u0435\u043D\u043E \u0437\u0430 \u0434\u043E\u043F\u043E\u043C\u043E\u0433\u043E\u044E",
    },
    graph: {
      title: "\u0412\u0438\u0433\u043B\u044F\u0434 \u0433\u0440\u0430\u0444\u0430",
    },
    recentNotes: {
      title:
        "\u041E\u0441\u0442\u0430\u043D\u043D\u0456 \u043D\u043E\u0442\u0430\u0442\u043A\u0438",
      seeRemainingMore: ({ remaining }) =>
        `\u041F\u0435\u0440\u0435\u0433\u043B\u044F\u043D\u0443\u0442\u0438 \u0449\u0435 ${remaining} \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) =>
        `\u0412\u0438\u0434\u043E\u0431\u0443\u0442\u043E \u0437 ${targetSlug}`,
      linkToOriginal:
        "\u041F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F \u043D\u0430 \u043E\u0440\u0438\u0433\u0456\u043D\u0430\u043B",
    },
    search: {
      title: "\u041F\u043E\u0448\u0443\u043A",
      searchBarPlaceholder: "\u0428\u0443\u043A\u0430\u0442\u0438 \u0449\u043E\u0441\u044C",
    },
    tableOfContents: {
      title: "\u0417\u043C\u0456\u0441\u0442",
    },
    contentMeta: {
      readingTime: ({ minutes }) =>
        `${minutes} \u0445\u0432 \u0447\u0438\u0442\u0430\u043D\u043D\u044F`,
    },
  },
  pages: {
    rss: {
      recentNotes:
        "\u041E\u0441\u0442\u0430\u043D\u043D\u0456 \u043D\u043E\u0442\u0430\u0442\u043A\u0438",
      lastFewNotes: ({ count }) =>
        `\u041E\u0441\u0442\u0430\u043D\u043D\u0456 \u043D\u043E\u0442\u0430\u0442\u043A\u0438: ${count}`,
    },
    error: {
      title: "\u041D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E",
      notFound:
        "\u0426\u044F \u0441\u0442\u043E\u0440\u0456\u043D\u043A\u0430 \u0430\u0431\u043E \u043F\u0440\u0438\u0432\u0430\u0442\u043D\u0430, \u0430\u0431\u043E \u043D\u0435 \u0456\u0441\u043D\u0443\u0454.",
      home: "\u041F\u043E\u0432\u0435\u0440\u043D\u0443\u0442\u0438\u0441\u044F \u043D\u0430 \u0433\u043E\u043B\u043E\u0432\u043D\u0443 \u0441\u0442\u043E\u0440\u0456\u043D\u043A\u0443",
    },
    folderContent: {
      folder: "\u0422\u0435\u043A\u0430",
      itemsUnderFolder: ({ count }) =>
        count === 1
          ? "\u0423 \u0446\u0456\u0439 \u0442\u0435\u0446\u0456 1 \u0435\u043B\u0435\u043C\u0435\u043D\u0442."
          : `\u0415\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432 \u0443 \u0446\u0456\u0439 \u0442\u0435\u0446\u0456: ${count}.`,
    },
    tagContent: {
      tag: "\u041C\u0456\u0442\u043A\u0430",
      tagIndex: "\u0406\u043D\u0434\u0435\u043A\u0441 \u043C\u0456\u0442\u043A\u0438",
      itemsUnderTag: ({ count }) =>
        count === 1
          ? "1 \u0435\u043B\u0435\u043C\u0435\u043D\u0442 \u0437 \u0446\u0456\u0454\u044E \u043C\u0456\u0442\u043A\u043E\u044E."
          : `\u0415\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432 \u0437 \u0446\u0456\u0454\u044E \u043C\u0456\u0442\u043A\u043E\u044E: ${count}.`,
      showingFirst: ({ count }) =>
        `\u041F\u043E\u043A\u0430\u0437 \u043F\u0435\u0440\u0448\u0438\u0445 ${count} \u043C\u0456\u0442\u043E\u043A.`,
      totalTags: ({ count }) =>
        `\u0412\u0441\u044C\u043E\u0433\u043E \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E \u043C\u0456\u0442\u043E\u043A: ${count}.`,
    },
  },
}

// ../../i18n/locales/ru-RU.ts
var ru_RU_default = {
  propertyDefaults: {
    title: "\u0411\u0435\u0437 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F",
    description:
      "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442",
  },
  components: {
    callout: {
      note: "\u0417\u0430\u043C\u0435\u0442\u043A\u0430",
      abstract: "\u0420\u0435\u0437\u044E\u043C\u0435",
      info: "\u0418\u043D\u0444\u043E",
      todo: "\u0421\u0434\u0435\u043B\u0430\u0442\u044C",
      tip: "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430",
      success: "\u0423\u0441\u043F\u0435\u0445",
      question: "\u0412\u043E\u043F\u0440\u043E\u0441",
      warning:
        "\u041F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u0435",
      failure: "\u041D\u0435\u0443\u0434\u0430\u0447\u0430",
      danger: "\u041E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C",
      bug: "\u0411\u0430\u0433",
      example: "\u041F\u0440\u0438\u043C\u0435\u0440",
      quote: "\u0426\u0438\u0442\u0430\u0442\u0430",
    },
    backlinks: {
      title:
        "\u041E\u0431\u0440\u0430\u0442\u043D\u044B\u0435 \u0441\u0441\u044B\u043B\u043A\u0438",
      noBacklinksFound:
        "\u041E\u0431\u0440\u0430\u0442\u043D\u044B\u0435 \u0441\u0441\u044B\u043B\u043A\u0438 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0442",
    },
    themeToggle: {
      lightMode: "\u0421\u0432\u0435\u0442\u043B\u044B\u0439 \u0440\u0435\u0436\u0438\u043C",
      darkMode: "\u0422\u0451\u043C\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C",
    },
    readerMode: {
      title: "\u0420\u0435\u0436\u0438\u043C \u0447\u0442\u0435\u043D\u0438\u044F",
    },
    explorer: {
      title: "\u041F\u0440\u043E\u0432\u043E\u0434\u043D\u0438\u043A",
    },
    footer: {
      createdWith:
        "\u0421\u043E\u0437\u0434\u0430\u043D\u043E \u0441 \u043F\u043E\u043C\u043E\u0449\u044C\u044E",
    },
    graph: {
      title: "\u0412\u0438\u0434 \u0433\u0440\u0430\u0444\u0430",
    },
    recentNotes: {
      title:
        "\u041D\u0435\u0434\u0430\u0432\u043D\u0438\u0435 \u0437\u0430\u043C\u0435\u0442\u043A\u0438",
      seeRemainingMore: ({ remaining }) =>
        `\u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043E\u0441\u0442\u0430\u0432\u0448${getForm(remaining, "\u0443\u044E\u0441\u044F", "\u0438\u0435\u0441\u044F", "\u0438\u0435\u0441\u044F")} ${remaining} \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) =>
        `\u041F\u0435\u0440\u0435\u0445\u043E\u0434 \u0438\u0437 ${targetSlug}`,
      linkToOriginal:
        "\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u043E\u0440\u0438\u0433\u0438\u043D\u0430\u043B",
    },
    search: {
      title: "\u041F\u043E\u0438\u0441\u043A",
      searchBarPlaceholder:
        "\u041D\u0430\u0439\u0442\u0438 \u0447\u0442\u043E-\u043D\u0438\u0431\u0443\u0434\u044C",
    },
    tableOfContents: {
      title: "\u041E\u0433\u043B\u0430\u0432\u043B\u0435\u043D\u0438\u0435",
    },
    contentMeta: {
      readingTime: ({ minutes }) =>
        `\u0432\u0440\u0435\u043C\u044F \u0447\u0442\u0435\u043D\u0438\u044F ~${minutes} \u043C\u0438\u043D.`,
    },
  },
  pages: {
    rss: {
      recentNotes:
        "\u041D\u0435\u0434\u0430\u0432\u043D\u0438\u0435 \u0437\u0430\u043C\u0435\u0442\u043A\u0438",
      lastFewNotes: ({ count }) =>
        `\u041F\u043E\u0441\u043B\u0435\u0434\u043D${getForm(count, "\u044F\u044F", "\u0438\u0435", "\u0438\u0435")} ${count} \u0437\u0430\u043C\u0435\u0442${getForm(count, "\u043A\u0430", "\u043A\u0438", "\u043E\u043A")}`,
    },
    error: {
      title:
        "\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430",
      notFound:
        "\u042D\u0442\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u043F\u0440\u0438\u0432\u0430\u0442\u043D\u0430\u044F \u0438\u043B\u0438 \u043D\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442",
      home: "\u0412\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u043D\u0430 \u0433\u043B\u0430\u0432\u043D\u0443\u044E \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443",
    },
    folderContent: {
      folder: "\u041F\u0430\u043F\u043A\u0430",
      itemsUnderFolder: ({ count }) =>
        `\u0432 \u044D\u0442\u043E\u0439 \u043F\u0430\u043F\u043A\u0435 ${count} \u044D\u043B\u0435\u043C\u0435\u043D\u0442${getForm(count, "", "\u0430", "\u043E\u0432")}`,
    },
    tagContent: {
      tag: "\u0422\u0435\u0433",
      tagIndex: "\u0418\u043D\u0434\u0435\u043A\u0441 \u0442\u0435\u0433\u043E\u0432",
      itemsUnderTag: ({ count }) =>
        `\u0441 \u044D\u0442\u0438\u043C \u0442\u0435\u0433\u043E\u043C ${count} \u044D\u043B\u0435\u043C\u0435\u043D\u0442${getForm(count, "", "\u0430", "\u043E\u0432")}`,
      showingFirst: ({ count }) =>
        `\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430${getForm(count, "\u0435\u0442\u0441\u044F", "\u044E\u0442\u0441\u044F", "\u044E\u0442\u0441\u044F")} ${count} \u0442\u0435\u0433${getForm(count, "", "\u0430", "\u043E\u0432")}`,
      totalTags: ({ count }) =>
        `\u0412\u0441\u0435\u0433\u043E ${count} \u0442\u0435\u0433${getForm(count, "", "\u0430", "\u043E\u0432")}`,
    },
  },
}
function getForm(number, form1, form2, form5) {
  const remainder100 = number % 100
  const remainder10 = remainder100 % 10
  if (remainder100 >= 10 && remainder100 <= 20) return form5
  if (remainder10 > 1 && remainder10 < 5) return form2
  if (remainder10 == 1) return form1
  return form5
}

// ../../i18n/locales/ko-KR.ts
var ko_KR_default = {
  propertyDefaults: {
    title: "\uC81C\uBAA9 \uC5C6\uC74C",
    description: "\uC124\uBA85 \uC5C6\uC74C",
  },
  components: {
    callout: {
      note: "\uB178\uD2B8",
      abstract: "\uAC1C\uC694",
      info: "\uC815\uBCF4",
      todo: "\uD560\uC77C",
      tip: "\uD301",
      success: "\uC131\uACF5",
      question: "\uC9C8\uBB38",
      warning: "\uC8FC\uC758",
      failure: "\uC2E4\uD328",
      danger: "\uC704\uD5D8",
      bug: "\uBC84\uADF8",
      example: "\uC608\uC2DC",
      quote: "\uC778\uC6A9",
    },
    backlinks: {
      title: "\uBC31\uB9C1\uD06C",
      noBacklinksFound: "\uBC31\uB9C1\uD06C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
    },
    themeToggle: {
      lightMode: "\uB77C\uC774\uD2B8 \uBAA8\uB4DC",
      darkMode: "\uB2E4\uD06C \uBAA8\uB4DC",
    },
    readerMode: {
      title: "\uB9AC\uB354 \uBAA8\uB4DC",
    },
    explorer: {
      title: "\uD0D0\uC0C9\uAE30",
    },
    footer: {
      createdWith: "Created with",
    },
    graph: {
      title: "\uADF8\uB798\uD504 \uBDF0",
    },
    recentNotes: {
      title: "\uCD5C\uADFC \uAC8C\uC2DC\uAE00",
      seeRemainingMore: ({ remaining }) => `${remaining}\uAC74 \uB354\uBCF4\uAE30 \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `${targetSlug}\uC758 \uD3EC\uD568`,
      linkToOriginal: "\uC6D0\uBCF8 \uB9C1\uD06C",
    },
    search: {
      title: "\uAC80\uC0C9",
      searchBarPlaceholder: "\uAC80\uC0C9\uC5B4\uB97C \uC785\uB825\uD558\uC138\uC694",
    },
    tableOfContents: {
      title: "\uBAA9\uCC28",
    },
    contentMeta: {
      readingTime: ({ minutes }) => `${minutes} min read`,
    },
  },
  pages: {
    rss: {
      recentNotes: "\uCD5C\uADFC \uAC8C\uC2DC\uAE00",
      lastFewNotes: ({ count }) => `\uCD5C\uADFC ${count} \uAC74`,
    },
    error: {
      title: "Not Found",
      notFound:
        "\uD398\uC774\uC9C0\uAC00 \uC874\uC7AC\uD558\uC9C0 \uC54A\uAC70\uB098 \uBE44\uACF5\uAC1C \uC124\uC815\uC774 \uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.",
      home: "\uD648\uD398\uC774\uC9C0\uB85C \uB3CC\uC544\uAC00\uAE30",
    },
    folderContent: {
      folder: "\uD3F4\uB354",
      itemsUnderFolder: ({ count }) => `${count}\uAC74\uC758 \uD56D\uBAA9`,
    },
    tagContent: {
      tag: "\uD0DC\uADF8",
      tagIndex: "\uD0DC\uADF8 \uBAA9\uB85D",
      itemsUnderTag: ({ count }) => `${count}\uAC74\uC758 \uD56D\uBAA9`,
      showingFirst: ({ count }) => `\uCC98\uC74C ${count}\uAC1C\uC758 \uD0DC\uADF8`,
      totalTags: ({ count }) =>
        `\uCD1D ${count}\uAC1C\uC758 \uD0DC\uADF8\uB97C \uCC3E\uC558\uC2B5\uB2C8\uB2E4.`,
    },
  },
}

// ../../i18n/locales/zh-CN.ts
var zh_CN_default = {
  propertyDefaults: {
    title: "\u65E0\u9898",
    description: "\u65E0\u63CF\u8FF0",
  },
  components: {
    callout: {
      note: "\u7B14\u8BB0",
      abstract: "\u6458\u8981",
      info: "\u63D0\u793A",
      todo: "\u5F85\u529E",
      tip: "\u63D0\u793A",
      success: "\u6210\u529F",
      question: "\u95EE\u9898",
      warning: "\u8B66\u544A",
      failure: "\u5931\u8D25",
      danger: "\u5371\u9669",
      bug: "\u9519\u8BEF",
      example: "\u793A\u4F8B",
      quote: "\u5F15\u7528",
    },
    backlinks: {
      title: "\u53CD\u5411\u94FE\u63A5",
      noBacklinksFound: "\u65E0\u6CD5\u627E\u5230\u53CD\u5411\u94FE\u63A5",
    },
    themeToggle: {
      lightMode: "\u4EAE\u8272\u6A21\u5F0F",
      darkMode: "\u6697\u8272\u6A21\u5F0F",
    },
    readerMode: {
      title: "\u9605\u8BFB\u6A21\u5F0F",
    },
    explorer: {
      title: "\u63A2\u7D22",
    },
    footer: {
      createdWith: "Created with",
    },
    graph: {
      title: "\u5173\u7CFB\u56FE\u8C31",
    },
    recentNotes: {
      title: "\u6700\u8FD1\u7684\u7B14\u8BB0",
      seeRemainingMore: ({ remaining }) =>
        `\u67E5\u770B\u66F4\u591A${remaining}\u7BC7\u7B14\u8BB0 \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `\u5305\u542B${targetSlug}`,
      linkToOriginal: "\u6307\u5411\u539F\u59CB\u7B14\u8BB0\u7684\u94FE\u63A5",
    },
    search: {
      title: "\u641C\u7D22",
      searchBarPlaceholder: "\u641C\u7D22\u4E9B\u4EC0\u4E48",
    },
    tableOfContents: {
      title: "\u76EE\u5F55",
    },
    contentMeta: {
      readingTime: ({ minutes }) => `${minutes}\u5206\u949F\u9605\u8BFB`,
    },
  },
  pages: {
    rss: {
      recentNotes: "\u6700\u8FD1\u7684\u7B14\u8BB0",
      lastFewNotes: ({ count }) => `\u6700\u8FD1\u7684${count}\u6761\u7B14\u8BB0`,
    },
    error: {
      title: "\u65E0\u6CD5\u627E\u5230",
      notFound: "\u79C1\u6709\u7B14\u8BB0\u6216\u7B14\u8BB0\u4E0D\u5B58\u5728\u3002",
      home: "\u8FD4\u56DE\u9996\u9875",
    },
    folderContent: {
      folder: "\u6587\u4EF6\u5939",
      itemsUnderFolder: ({ count }) =>
        `\u6B64\u6587\u4EF6\u5939\u4E0B\u6709${count}\u6761\u7B14\u8BB0\u3002`,
    },
    tagContent: {
      tag: "\u6807\u7B7E",
      tagIndex: "\u6807\u7B7E\u7D22\u5F15",
      itemsUnderTag: ({ count }) =>
        `\u6B64\u6807\u7B7E\u4E0B\u6709${count}\u6761\u7B14\u8BB0\u3002`,
      showingFirst: ({ count }) => `\u663E\u793A\u524D${count}\u4E2A\u6807\u7B7E\u3002`,
      totalTags: ({ count }) => `\u603B\u5171\u6709${count}\u4E2A\u6807\u7B7E\u3002`,
    },
  },
}

// ../../i18n/locales/zh-TW.ts
var zh_TW_default = {
  propertyDefaults: {
    title: "\u7121\u984C",
    description: "\u7121\u63CF\u8FF0",
  },
  components: {
    callout: {
      note: "\u7B46\u8A18",
      abstract: "\u6458\u8981",
      info: "\u63D0\u793A",
      todo: "\u5F85\u8FA6",
      tip: "\u63D0\u793A",
      success: "\u6210\u529F",
      question: "\u554F\u984C",
      warning: "\u8B66\u544A",
      failure: "\u5931\u6557",
      danger: "\u5371\u96AA",
      bug: "\u932F\u8AA4",
      example: "\u7BC4\u4F8B",
      quote: "\u5F15\u7528",
    },
    backlinks: {
      title: "\u53CD\u5411\u9023\u7D50",
      noBacklinksFound: "\u7121\u6CD5\u627E\u5230\u53CD\u5411\u9023\u7D50",
    },
    themeToggle: {
      lightMode: "\u4EAE\u8272\u6A21\u5F0F",
      darkMode: "\u6697\u8272\u6A21\u5F0F",
    },
    readerMode: {
      title: "\u95B1\u8B80\u6A21\u5F0F",
    },
    explorer: {
      title: "\u63A2\u7D22",
    },
    footer: {
      createdWith: "Created with",
    },
    graph: {
      title: "\u95DC\u4FC2\u5716\u8B5C",
    },
    recentNotes: {
      title: "\u6700\u8FD1\u7684\u7B46\u8A18",
      seeRemainingMore: ({ remaining }) =>
        `\u67E5\u770B\u66F4\u591A ${remaining} \u7BC7\u7B46\u8A18 \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `\u5305\u542B ${targetSlug}`,
      linkToOriginal: "\u6307\u5411\u539F\u59CB\u7B46\u8A18\u7684\u9023\u7D50",
    },
    search: {
      title: "\u641C\u5C0B",
      searchBarPlaceholder: "\u641C\u5C0B\u4E9B\u4EC0\u9EBC",
    },
    tableOfContents: {
      title: "\u76EE\u9304",
    },
    contentMeta: {
      readingTime: ({ minutes }) => `\u95B1\u8B80\u6642\u9593\u7D04 ${minutes} \u5206\u9418`,
    },
  },
  pages: {
    rss: {
      recentNotes: "\u6700\u8FD1\u7684\u7B46\u8A18",
      lastFewNotes: ({ count }) => `\u6700\u8FD1\u7684 ${count} \u689D\u7B46\u8A18`,
    },
    error: {
      title: "\u7121\u6CD5\u627E\u5230",
      notFound: "\u79C1\u4EBA\u7B46\u8A18\u6216\u7B46\u8A18\u4E0D\u5B58\u5728\u3002",
      home: "\u8FD4\u56DE\u9996\u9801",
    },
    folderContent: {
      folder: "\u8CC7\u6599\u593E",
      itemsUnderFolder: ({ count }) =>
        `\u6B64\u8CC7\u6599\u593E\u4E0B\u6709 ${count} \u689D\u7B46\u8A18\u3002`,
    },
    tagContent: {
      tag: "\u6A19\u7C64",
      tagIndex: "\u6A19\u7C64\u7D22\u5F15",
      itemsUnderTag: ({ count }) =>
        `\u6B64\u6A19\u7C64\u4E0B\u6709 ${count} \u689D\u7B46\u8A18\u3002`,
      showingFirst: ({ count }) => `\u986F\u793A\u524D ${count} \u500B\u6A19\u7C64\u3002`,
      totalTags: ({ count }) => `\u7E3D\u5171\u6709 ${count} \u500B\u6A19\u7C64\u3002`,
    },
  },
}

// ../../i18n/locales/vi-VN.ts
var vi_VN_default = {
  propertyDefaults: {
    title: "Kh\xF4ng c\xF3 ti\xEAu \u0111\u1EC1",
    description: "Kh\xF4ng c\xF3 m\xF4 t\u1EA3",
  },
  components: {
    callout: {
      note: "Ghi ch\xFA",
      abstract: "T\u1ED5ng quan",
      info: "Th\xF4ng tin",
      todo: "C\u1EA7n ph\u1EA3i l\xE0m",
      tip: "G\u1EE3i \xFD",
      success: "Th\xE0nh c\xF4ng",
      question: "C\xE2u h\u1ECFi",
      warning: "C\u1EA3nh b\xE1o",
      failure: "Th\u1EA5t b\u1EA1i",
      danger: "Nguy hi\u1EC3m",
      bug: "L\u1ED7i",
      example: "V\xED d\u1EE5",
      quote: "Tr\xEDch d\u1EABn",
    },
    backlinks: {
      title: "Li\xEAn k\u1EBFt ng\u01B0\u1EE3c",
      noBacklinksFound: "Kh\xF4ng c\xF3 li\xEAn k\u1EBFt ng\u01B0\u1EE3c n\xE0o",
    },
    themeToggle: {
      lightMode: "Ch\u1EBF \u0111\u1ED9 s\xE1ng",
      darkMode: "Ch\u1EBF \u0111\u1ED9 t\u1ED1i",
    },
    readerMode: {
      title: "Ch\u1EBF \u0111\u1ED9 \u0111\u1ECDc",
    },
    explorer: {
      title: "N\u1ED9i dung",
    },
    footer: {
      createdWith: "\u0110\u01B0\u1EE3c t\u1EA1o b\u1EB1ng",
    },
    graph: {
      title: "S\u01A1 \u0111\u1ED3",
    },
    recentNotes: {
      title: "Ghi ch\xFA g\u1EA7n \u0111\xE2y",
      seeRemainingMore: ({ remaining }) => `Xem th\xEAm ${remaining} ghi ch\xFA \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `Tr\xEDch d\u1EABn to\xE0n b\u1ED9 t\u1EEB ${targetSlug}`,
      linkToOriginal: "Xem trang g\u1ED1c",
    },
    search: {
      title: "T\xECm",
      searchBarPlaceholder: "T\xECm ki\u1EBFm th\xF4ng tin",
    },
    tableOfContents: {
      title: "M\u1EE5c l\u1EE5c",
    },
    contentMeta: {
      readingTime: ({ minutes }) => `${minutes} ph\xFAt \u0111\u1ECDc`,
    },
  },
  pages: {
    rss: {
      recentNotes: "Ghi ch\xFA g\u1EA7n \u0111\xE2y",
      lastFewNotes: ({ count }) => `${count} Trang g\u1EA7n \u0111\xE2y`,
    },
    error: {
      title: "Kh\xF4ng t\xECm th\u1EA5y",
      notFound: "Trang n\xE0y ri\xEAng t\u01B0 ho\u1EB7c kh\xF4ng t\u1ED3n t\u1EA1i.",
      home: "V\u1EC1 trang ch\u1EE7",
    },
    folderContent: {
      folder: "Th\u01B0 m\u1EE5c",
      itemsUnderFolder: ({ count }) => `C\xF3 ${count} trang trong th\u01B0 m\u1EE5c n\xE0y.`,
    },
    tagContent: {
      tag: "Th\u1EBB",
      tagIndex: "Danh s\xE1ch th\u1EBB",
      itemsUnderTag: ({ count }) => `C\xF3 ${count} trang g\u1EAFn th\u1EBB n\xE0y.`,
      showingFirst: ({ count }) =>
        `\u0110ang hi\u1EC3n th\u1ECB ${count} trang \u0111\u1EA7u ti\xEAn.`,
      totalTags: ({ count }) => `C\xF3 t\u1ED5ng c\u1ED9ng ${count} th\u1EBB.`,
    },
  },
}

// ../../i18n/locales/pt-BR.ts
var pt_BR_default = {
  propertyDefaults: {
    title: "Sem t\xEDtulo",
    description: "Sem descri\xE7\xE3o",
  },
  components: {
    callout: {
      note: "Nota",
      abstract: "Abstrato",
      info: "Info",
      todo: "Pend\xEAncia",
      tip: "Dica",
      success: "Sucesso",
      question: "Pergunta",
      warning: "Aviso",
      failure: "Falha",
      danger: "Perigo",
      bug: "Bug",
      example: "Exemplo",
      quote: "Cita\xE7\xE3o",
    },
    backlinks: {
      title: "Backlinks",
      noBacklinksFound: "Sem backlinks encontrados",
    },
    themeToggle: {
      lightMode: "Tema claro",
      darkMode: "Tema escuro",
    },
    readerMode: {
      title: "Modo leitor",
    },
    explorer: {
      title: "Explorador",
    },
    footer: {
      createdWith: "Criado com",
    },
    graph: {
      title: "Vis\xE3o de gr\xE1fico",
    },
    recentNotes: {
      title: "Notas recentes",
      seeRemainingMore: ({ remaining }) => `Veja mais ${remaining} \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `Transcrever de ${targetSlug}`,
      linkToOriginal: "Link ao original",
    },
    search: {
      title: "Pesquisar",
      searchBarPlaceholder: "Pesquisar por algo",
    },
    tableOfContents: {
      title: "Sum\xE1rio",
    },
    contentMeta: {
      readingTime: ({ minutes }) => `Leitura de ${minutes} min`,
    },
  },
  pages: {
    rss: {
      recentNotes: "Notas recentes",
      lastFewNotes: ({ count }) => `\xDAltimas ${count} notas`,
    },
    error: {
      title: "N\xE3o encontrado",
      notFound: "Esta p\xE1gina \xE9 privada ou n\xE3o existe.",
      home: "Retornar a p\xE1gina inicial",
    },
    folderContent: {
      folder: "Arquivo",
      itemsUnderFolder: ({ count }) =>
        count === 1 ? "1 item neste arquivo." : `${count} items neste arquivo.`,
    },
    tagContent: {
      tag: "Tag",
      tagIndex: "Sum\xE1rio de Tags",
      itemsUnderTag: ({ count }) =>
        count === 1 ? "1 item com esta tag." : `${count} items com esta tag.`,
      showingFirst: ({ count }) => `Mostrando as ${count} primeiras tags.`,
      totalTags: ({ count }) => `Encontradas ${count} tags.`,
    },
  },
}

// ../../i18n/locales/hu-HU.ts
var hu_HU_default = {
  propertyDefaults: {
    title: "N\xE9vtelen",
    description: "Nincs le\xEDr\xE1s",
  },
  components: {
    callout: {
      note: "Jegyzet",
      abstract: "Abstract",
      info: "Inform\xE1ci\xF3",
      todo: "Tennival\xF3",
      tip: "Tipp",
      success: "Siker",
      question: "K\xE9rd\xE9s",
      warning: "Figyelmeztet\xE9s",
      failure: "Hiba",
      danger: "Vesz\xE9ly",
      bug: "Bug",
      example: "P\xE9lda",
      quote: "Id\xE9zet",
    },
    backlinks: {
      title: "Visszautal\xE1sok",
      noBacklinksFound: "Nincs visszautal\xE1s",
    },
    themeToggle: {
      lightMode: "Vil\xE1gos m\xF3d",
      darkMode: "S\xF6t\xE9t m\xF3d",
    },
    readerMode: {
      title: "Olvas\xF3 m\xF3d",
    },
    explorer: {
      title: "F\xE1jlb\xF6ng\xE9sz\u0151",
    },
    footer: {
      createdWith: "K\xE9sz\xEDtve ezzel:",
    },
    graph: {
      title: "Grafikonn\xE9zet",
    },
    recentNotes: {
      title: "Legut\xF3bbi jegyzetek",
      seeRemainingMore: ({ remaining }) => `${remaining} tov\xE1bbi megtekint\xE9se \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `${targetSlug} \xE1thivatkoz\xE1sa`,
      linkToOriginal: "Hivatkoz\xE1s az eredetire",
    },
    search: {
      title: "Keres\xE9s",
      searchBarPlaceholder: "Keress valamire",
    },
    tableOfContents: {
      title: "Tartalomjegyz\xE9k",
    },
    contentMeta: {
      readingTime: ({ minutes }) => `${minutes} perces olvas\xE1s`,
    },
  },
  pages: {
    rss: {
      recentNotes: "Legut\xF3bbi jegyzetek",
      lastFewNotes: ({ count }) => `Legut\xF3bbi ${count} jegyzet`,
    },
    error: {
      title: "Nem tal\xE1lhat\xF3",
      notFound: "Ez a lap vagy priv\xE1t vagy nem l\xE9tezik.",
      home: "Vissza a kezd\u0151lapra",
    },
    folderContent: {
      folder: "Mappa",
      itemsUnderFolder: ({ count }) => `Ebben a mapp\xE1ban ${count} elem tal\xE1lhat\xF3.`,
    },
    tagContent: {
      tag: "C\xEDmke",
      tagIndex: "C\xEDmke index",
      itemsUnderTag: ({ count }) => `${count} elem tal\xE1lhat\xF3 ezzel a c\xEDmk\xE9vel.`,
      showingFirst: ({ count }) => `Els\u0151 ${count} c\xEDmke megjelen\xEDtve.`,
      totalTags: ({ count }) => `\xD6sszesen ${count} c\xEDmke tal\xE1lhat\xF3.`,
    },
  },
}

// ../../i18n/locales/fa-IR.ts
var fa_IR_default = {
  propertyDefaults: {
    title: "\u0628\u062F\u0648\u0646 \u0639\u0646\u0648\u0627\u0646",
    description:
      "\u062A\u0648\u0636\u06CC\u062D \u062E\u0627\u0635\u06CC \u0627\u0636\u0627\u0641\u0647 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A",
  },
  direction: "rtl",
  components: {
    callout: {
      note: "\u06CC\u0627\u062F\u062F\u0627\u0634\u062A",
      abstract: "\u0686\u06A9\u06CC\u062F\u0647",
      info: "\u0627\u0637\u0644\u0627\u0639\u0627\u062A",
      todo: "\u0627\u0642\u062F\u0627\u0645",
      tip: "\u0646\u06A9\u062A\u0647",
      success: "\u062A\u06CC\u06A9",
      question: "\u0633\u0624\u0627\u0644",
      warning: "\u0647\u0634\u062F\u0627\u0631",
      failure: "\u0634\u06A9\u0633\u062A",
      danger: "\u062E\u0637\u0631",
      bug: "\u0628\u0627\u06AF",
      example: "\u0645\u062B\u0627\u0644",
      quote: "\u0646\u0642\u0644 \u0642\u0648\u0644",
    },
    backlinks: {
      title: "\u0628\u06A9\u200C\u0644\u06CC\u0646\u06A9\u200C\u0647\u0627",
      noBacklinksFound: "\u0628\u062F\u0648\u0646 \u0628\u06A9\u200C\u0644\u06CC\u0646\u06A9",
    },
    themeToggle: {
      lightMode: "\u062D\u0627\u0644\u062A \u0631\u0648\u0634\u0646",
      darkMode: "\u062D\u0627\u0644\u062A \u062A\u0627\u0631\u06CC\u06A9",
    },
    readerMode: {
      title: "\u062D\u0627\u0644\u062A \u062E\u0648\u0627\u0646\u062F\u0646",
    },
    explorer: {
      title: "\u0645\u0637\u0627\u0644\u0628",
    },
    footer: {
      createdWith: "\u0633\u0627\u062E\u062A\u0647 \u0634\u062F\u0647 \u0628\u0627",
    },
    graph: {
      title: "\u0646\u0645\u0627\u06CC \u06AF\u0631\u0627\u0641",
    },
    recentNotes: {
      title:
        "\u06CC\u0627\u062F\u062F\u0627\u0634\u062A\u200C\u0647\u0627\u06CC \u0627\u062E\u06CC\u0631",
      seeRemainingMore: ({ remaining }) =>
        `${remaining} \u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u062F\u06CC\u06AF\u0631 \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `\u0627\u0632 ${targetSlug}`,
      linkToOriginal: "\u067E\u06CC\u0648\u0646\u062F \u0628\u0647 \u0627\u0635\u0644\u06CC",
    },
    search: {
      title: "\u062C\u0633\u062A\u062C\u0648",
      searchBarPlaceholder:
        "\u0645\u0637\u0644\u0628\u06CC \u0631\u0627 \u062C\u0633\u062A\u062C\u0648 \u06A9\u0646\u06CC\u062F",
    },
    tableOfContents: {
      title: "\u0641\u0647\u0631\u0633\u062A",
    },
    contentMeta: {
      readingTime: ({ minutes }) =>
        `\u0632\u0645\u0627\u0646 \u062A\u0642\u0631\u06CC\u0628\u06CC \u0645\u0637\u0627\u0644\u0639\u0647: ${minutes} \u062F\u0642\u06CC\u0642\u0647`,
    },
  },
  pages: {
    rss: {
      recentNotes:
        "\u06CC\u0627\u062F\u062F\u0627\u0634\u062A\u200C\u0647\u0627\u06CC \u0627\u062E\u06CC\u0631",
      lastFewNotes: ({ count }) =>
        `${count} \u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u0627\u062E\u06CC\u0631`,
    },
    error: {
      title: "\u06CC\u0627\u0641\u062A \u0646\u0634\u062F",
      notFound:
        "\u0627\u06CC\u0646 \u0635\u0641\u062D\u0647 \u06CC\u0627 \u062E\u0635\u0648\u0635\u06CC \u0627\u0633\u062A \u06CC\u0627 \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F",
      home: "\u0628\u0627\u0632\u06AF\u0634\u062A \u0628\u0647 \u0635\u0641\u062D\u0647 \u0627\u0635\u0644\u06CC",
    },
    folderContent: {
      folder: "\u067E\u0648\u0634\u0647",
      itemsUnderFolder: ({ count }) =>
        count === 1
          ? ".\u06CC\u06A9 \u0645\u0637\u0644\u0628 \u062F\u0631 \u0627\u06CC\u0646 \u067E\u0648\u0634\u0647 \u0627\u0633\u062A"
          : `${count} \u0645\u0637\u0644\u0628 \u062F\u0631 \u0627\u06CC\u0646 \u067E\u0648\u0634\u0647 \u0627\u0633\u062A.`,
    },
    tagContent: {
      tag: "\u0628\u0631\u0686\u0633\u0628",
      tagIndex: "\u0641\u0647\u0631\u0633\u062A \u0628\u0631\u0686\u0633\u0628\u200C\u0647\u0627",
      itemsUnderTag: ({ count }) =>
        count === 1
          ? "\u06CC\u06A9 \u0645\u0637\u0644\u0628 \u0628\u0627 \u0627\u06CC\u0646 \u0628\u0631\u0686\u0633\u0628"
          : `${count} \u0645\u0637\u0644\u0628 \u0628\u0627 \u0627\u06CC\u0646 \u0628\u0631\u0686\u0633\u0628.`,
      showingFirst: ({ count }) =>
        `\u062F\u0631 \u062D\u0627\u0644 \u0646\u0645\u0627\u06CC\u0634 ${count} \u0628\u0631\u0686\u0633\u0628.`,
      totalTags: ({ count }) =>
        `${count} \u0628\u0631\u0686\u0633\u0628 \u06CC\u0627\u0641\u062A \u0634\u062F.`,
    },
  },
}

// ../../i18n/locales/pl-PL.ts
var pl_PL_default = {
  propertyDefaults: {
    title: "Bez nazwy",
    description: "Brak opisu",
  },
  components: {
    callout: {
      note: "Notatka",
      abstract: "Streszczenie",
      info: "informacja",
      todo: "Do zrobienia",
      tip: "Wskaz\xF3wka",
      success: "Zrobione",
      question: "Pytanie",
      warning: "Ostrze\u017Cenie",
      failure: "Usterka",
      danger: "Niebiezpiecze\u0144stwo",
      bug: "B\u0142\u0105d w kodzie",
      example: "Przyk\u0142ad",
      quote: "Cytat",
    },
    backlinks: {
      title: "Odno\u015Bniki zwrotne",
      noBacklinksFound: "Brak po\u0142\u0105cze\u0144 zwrotnych",
    },
    themeToggle: {
      lightMode: "Trzyb jasny",
      darkMode: "Tryb ciemny",
    },
    readerMode: {
      title: "Tryb czytania",
    },
    explorer: {
      title: "Przegl\u0105daj",
    },
    footer: {
      createdWith: "Stworzone z u\u017Cyciem",
    },
    graph: {
      title: "Graf",
    },
    recentNotes: {
      title: "Najnowsze notatki",
      seeRemainingMore: ({ remaining }) => `Zobacz ${remaining} nastepnych \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `Osadzone ${targetSlug}`,
      linkToOriginal: "\u0141\u0105cze do orygina\u0142u",
    },
    search: {
      title: "Szukaj",
      searchBarPlaceholder: "Wpisz fraz\u0119 wyszukiwania",
    },
    tableOfContents: {
      title: "Spis tre\u015Bci",
    },
    contentMeta: {
      readingTime: ({ minutes }) => `${minutes} min. czytania `,
    },
  },
  pages: {
    rss: {
      recentNotes: "Najnowsze notatki",
      lastFewNotes: ({ count }) => `Ostatnie ${count} notatek`,
    },
    error: {
      title: "Nie znaleziono",
      notFound: "Ta strona jest prywatna lub nie istnieje.",
      home: "Powr\xF3t do strony g\u0142\xF3wnej",
    },
    folderContent: {
      folder: "Folder",
      itemsUnderFolder: ({ count }) =>
        count === 1 ? "W tym folderze jest 1 element." : `Element\xF3w w folderze: ${count}.`,
    },
    tagContent: {
      tag: "Znacznik",
      tagIndex: "Spis znacznik\xF3w",
      itemsUnderTag: ({ count }) =>
        count === 1 ? "Oznaczony 1 element." : `Element\xF3w z tym znacznikiem: ${count}.`,
      showingFirst: ({ count }) => `Pokazuje ${count} pierwszych znacznik\xF3w.`,
      totalTags: ({ count }) => `Znalezionych wszystkich znacznik\xF3w: ${count}.`,
    },
  },
}

// ../../i18n/locales/cs-CZ.ts
var cs_CZ_default = {
  propertyDefaults: {
    title: "Bez n\xE1zvu",
    description: "Nebyl uveden \u017E\xE1dn\xFD popis",
  },
  components: {
    callout: {
      note: "Pozn\xE1mka",
      abstract: "Abstract",
      info: "Info",
      todo: "Todo",
      tip: "Tip",
      success: "\xDAsp\u011Bch",
      question: "Ot\xE1zka",
      warning: "Upozorn\u011Bn\xED",
      failure: "Chyba",
      danger: "Nebezpe\u010D\xED",
      bug: "Bug",
      example: "P\u0159\xEDklad",
      quote: "Citace",
    },
    backlinks: {
      title: "P\u0159\xEDchoz\xED odkazy",
      noBacklinksFound: "Nenalezeny \u017E\xE1dn\xE9 p\u0159\xEDchoz\xED odkazy",
    },
    themeToggle: {
      lightMode: "Sv\u011Btl\xFD re\u017Eim",
      darkMode: "Tmav\xFD re\u017Eim",
    },
    readerMode: {
      title: "Re\u017Eim \u010Dte\u010Dky",
    },
    explorer: {
      title: "Proch\xE1zet",
    },
    footer: {
      createdWith: "Vytvo\u0159eno pomoc\xED",
    },
    graph: {
      title: "Graf",
    },
    recentNotes: {
      title: "Nejnov\u011Bj\u0161\xED pozn\xE1mky",
      seeRemainingMore: ({ remaining }) => `Zobraz ${remaining} dal\u0161\xEDch \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `Zobrazen\xED ${targetSlug}`,
      linkToOriginal: "Odkaz na p\u016Fvodn\xED dokument",
    },
    search: {
      title: "Hledat",
      searchBarPlaceholder: "Hledejte n\u011Bco",
    },
    tableOfContents: {
      title: "Obsah",
    },
    contentMeta: {
      readingTime: ({ minutes }) => `${minutes} min \u010Dten\xED`,
    },
  },
  pages: {
    rss: {
      recentNotes: "Nejnov\u011Bj\u0161\xED pozn\xE1mky",
      lastFewNotes: ({ count }) => `Posledn\xEDch ${count} pozn\xE1mek`,
    },
    error: {
      title: "Nenalezeno",
      notFound: "Tato str\xE1nka je bu\u010F soukrom\xE1, nebo neexistuje.",
      home: "N\xE1vrat na domovskou str\xE1nku",
    },
    folderContent: {
      folder: "Slo\u017Eka",
      itemsUnderFolder: ({ count }) =>
        count === 1
          ? "1 polo\u017Eka v t\xE9to slo\u017Ece."
          : `${count} polo\u017Eek v t\xE9to slo\u017Ece.`,
    },
    tagContent: {
      tag: "Tag",
      tagIndex: "Rejst\u0159\xEDk tag\u016F",
      itemsUnderTag: ({ count }) =>
        count === 1
          ? "1 polo\u017Eka s t\xEDmto tagem."
          : `${count} polo\u017Eek s t\xEDmto tagem.`,
      showingFirst: ({ count }) => `Zobrazuj\xED se prvn\xED ${count} tagy.`,
      totalTags: ({ count }) => `Nalezeno celkem ${count} tag\u016F.`,
    },
  },
}

// ../../i18n/locales/tr-TR.ts
var tr_TR_default = {
  propertyDefaults: {
    title: "\u0130simsiz",
    description: "Herhangi bir a\xE7\u0131klama eklenmedi",
  },
  components: {
    callout: {
      note: "Not",
      abstract: "\xD6zet",
      info: "Bilgi",
      todo: "Yap\u0131lacaklar",
      tip: "\u0130pucu",
      success: "Ba\u015Far\u0131l\u0131",
      question: "Soru",
      warning: "Uyar\u0131",
      failure: "Ba\u015Far\u0131s\u0131z",
      danger: "Tehlike",
      bug: "Hata",
      example: "\xD6rnek",
      quote: "Al\u0131nt\u0131",
    },
    backlinks: {
      title: "Backlinkler",
      noBacklinksFound: "Backlink bulunamad\u0131",
    },
    themeToggle: {
      lightMode: "A\xE7\u0131k mod",
      darkMode: "Koyu mod",
    },
    readerMode: {
      title: "Okuma modu",
    },
    explorer: {
      title: "Gezgin",
    },
    footer: {
      createdWith: "\u015Eununla olu\u015Fturuldu",
    },
    graph: {
      title: "Grafik G\xF6r\xFCn\xFCm\xFC",
    },
    recentNotes: {
      title: "Son Notlar",
      seeRemainingMore: ({ remaining }) => `${remaining} tane daha g\xF6r \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `${targetSlug} sayfas\u0131ndan al\u0131nt\u0131`,
      linkToOriginal: "Orijinal ba\u011Flant\u0131",
    },
    search: {
      title: "Arama",
      searchBarPlaceholder: "Bir \u015Fey aray\u0131n",
    },
    tableOfContents: {
      title: "\u0130\xE7indekiler",
    },
    contentMeta: {
      readingTime: ({ minutes }) => `${minutes} dakika okuma s\xFCresi`,
    },
  },
  pages: {
    rss: {
      recentNotes: "Son notlar",
      lastFewNotes: ({ count }) => `Son ${count} not`,
    },
    error: {
      title: "Bulunamad\u0131",
      notFound: "Bu sayfa ya \xF6zel ya da mevcut de\u011Fil.",
      home: "Anasayfaya geri d\xF6n",
    },
    folderContent: {
      folder: "Klas\xF6r",
      itemsUnderFolder: ({ count }) =>
        count === 1
          ? "Bu klas\xF6r alt\u0131nda 1 \xF6\u011Fe."
          : `Bu klas\xF6r alt\u0131ndaki ${count} \xF6\u011Fe.`,
    },
    tagContent: {
      tag: "Etiket",
      tagIndex: "Etiket S\u0131ras\u0131",
      itemsUnderTag: ({ count }) =>
        count === 1
          ? "Bu etikete sahip 1 \xF6\u011Fe."
          : `Bu etiket alt\u0131ndaki ${count} \xF6\u011Fe.`,
      showingFirst: ({ count }) => `\u0130lk ${count} etiket g\xF6steriliyor.`,
      totalTags: ({ count }) => `Toplam ${count} adet etiket bulundu.`,
    },
  },
}

// ../../i18n/locales/th-TH.ts
var th_TH_default = {
  propertyDefaults: {
    title: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E0A\u0E37\u0E48\u0E2D",
    description:
      "\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E30\u0E1A\u0E38\u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E22\u0E48\u0E2D",
  },
  components: {
    callout: {
      note: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38",
      abstract: "\u0E1A\u0E17\u0E04\u0E31\u0E14\u0E22\u0E48\u0E2D",
      info: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",
      todo: "\u0E15\u0E49\u0E2D\u0E07\u0E17\u0E33\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21",
      tip: "\u0E04\u0E33\u0E41\u0E19\u0E30\u0E19\u0E33",
      success: "\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22",
      question: "\u0E04\u0E33\u0E16\u0E32\u0E21",
      warning: "\u0E04\u0E33\u0E40\u0E15\u0E37\u0E2D\u0E19",
      failure: "\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14",
      danger: "\u0E2D\u0E31\u0E19\u0E15\u0E23\u0E32\u0E22",
      bug: "\u0E1A\u0E31\u0E4A\u0E01",
      example: "\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07",
      quote: "\u0E04\u0E33\u0E1E\u0E39\u0E01\u0E22\u0E01\u0E21\u0E32",
    },
    backlinks: {
      title:
        "\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E01\u0E25\u0E48\u0E32\u0E27\u0E16\u0E36\u0E07",
      noBacklinksFound:
        "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E42\u0E22\u0E07\u0E21\u0E32\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49",
    },
    themeToggle: {
      lightMode: "\u0E42\u0E2B\u0E21\u0E14\u0E2A\u0E27\u0E48\u0E32\u0E07",
      darkMode: "\u0E42\u0E2B\u0E21\u0E14\u0E21\u0E37\u0E14",
    },
    readerMode: {
      title: "\u0E42\u0E2B\u0E21\u0E14\u0E2D\u0E48\u0E32\u0E19",
    },
    explorer: {
      title: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2B\u0E19\u0E49\u0E32",
    },
    footer: {
      createdWith: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E14\u0E49\u0E27\u0E22",
    },
    graph: {
      title: "\u0E21\u0E38\u0E21\u0E21\u0E2D\u0E07\u0E01\u0E23\u0E32\u0E1F",
    },
    recentNotes: {
      title: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14",
      seeRemainingMore: ({ remaining }) =>
        `\u0E14\u0E39\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2D\u0E35\u0E01 ${remaining} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) =>
        `\u0E23\u0E27\u0E21\u0E02\u0E49\u0E32\u0E21\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E2B\u0E32\u0E08\u0E32\u0E01 ${targetSlug}`,
      linkToOriginal: "\u0E14\u0E39\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E49\u0E19\u0E17\u0E32\u0E07",
    },
    search: {
      title: "\u0E04\u0E49\u0E19\u0E2B\u0E32",
      searchBarPlaceholder:
        "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E1A\u0E32\u0E07\u0E2D\u0E22\u0E48\u0E32\u0E07",
    },
    tableOfContents: {
      title: "\u0E2A\u0E32\u0E23\u0E1A\u0E31\u0E0D",
    },
    contentMeta: {
      readingTime: ({ minutes }) =>
        `\u0E2D\u0E48\u0E32\u0E19\u0E23\u0E32\u0E27 ${minutes} \u0E19\u0E32\u0E17\u0E35`,
    },
  },
  pages: {
    rss: {
      recentNotes: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14",
      lastFewNotes: ({ count }) =>
        `${count} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14`,
    },
    error: {
      title: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49",
      notFound:
        "\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49\u0E2D\u0E32\u0E08\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E40\u0E1B\u0E47\u0E19\u0E2A\u0E48\u0E27\u0E19\u0E15\u0E31\u0E27\u0E2B\u0E23\u0E37\u0E2D\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E2A\u0E23\u0E49\u0E32\u0E07",
      home: "\u0E01\u0E25\u0E31\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E2B\u0E25\u0E31\u0E01",
    },
    folderContent: {
      folder: "\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C",
      itemsUnderFolder: ({ count }) =>
        `\u0E21\u0E35 ${count} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E19\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E19\u0E35\u0E49`,
    },
    tagContent: {
      tag: "\u0E41\u0E17\u0E47\u0E01",
      tagIndex: "\u0E41\u0E17\u0E47\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
      itemsUnderTag: ({ count }) =>
        `\u0E21\u0E35 ${count} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E19\u0E41\u0E17\u0E47\u0E01\u0E19\u0E35\u0E49`,
      showingFirst: ({ count }) =>
        `\u0E41\u0E2A\u0E14\u0E07 ${count} \u0E41\u0E17\u0E47\u0E01\u0E41\u0E23\u0E01`,
      totalTags: ({ count }) =>
        `\u0E21\u0E35\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 ${count} \u0E41\u0E17\u0E47\u0E01`,
    },
  },
}

// ../../i18n/locales/lt-LT.ts
var lt_LT_default = {
  propertyDefaults: {
    title: "Be Pavadinimo",
    description: "Apra\u0161ymas Nepateiktas",
  },
  components: {
    callout: {
      note: "Pastaba",
      abstract: "Santrauka",
      info: "Informacija",
      todo: "Darb\u0173 s\u0105ra\u0161as",
      tip: "Patarimas",
      success: "S\u0117kmingas",
      question: "Klausimas",
      warning: "\u012Esp\u0117jimas",
      failure: "Nes\u0117kmingas",
      danger: "Pavojus",
      bug: "Klaida",
      example: "Pavyzdys",
      quote: "Citata",
    },
    backlinks: {
      title: "Atgalin\u0117s Nuorodos",
      noBacklinksFound: "Atgalini\u0173 Nuorod\u0173 Nerasta",
    },
    themeToggle: {
      lightMode: "\u0160viesus Re\u017Eimas",
      darkMode: "Tamsus Re\u017Eimas",
    },
    readerMode: {
      title: "Modalit\xE0 lettore",
    },
    explorer: {
      title: "Nar\u0161ykl\u0117",
    },
    footer: {
      createdWith: "Sukurta Su",
    },
    graph: {
      title: "Grafiko Vaizdas",
    },
    recentNotes: {
      title: "Naujausi U\u017Era\u0161ai",
      seeRemainingMore: ({ remaining }) => `Per\u017Ei\u016Br\u0117ti dar ${remaining} \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `\u012Eterpimas i\u0161 ${targetSlug}`,
      linkToOriginal: "Nuoroda \u012F original\u0105",
    },
    search: {
      title: "Paie\u0161ka",
      searchBarPlaceholder: "Ie\u0161koti",
    },
    tableOfContents: {
      title: "Turinys",
    },
    contentMeta: {
      readingTime: ({ minutes }) => `${minutes} min skaitymo`,
    },
  },
  pages: {
    rss: {
      recentNotes: "Naujausi u\u017Era\u0161ai",
      lastFewNotes: ({ count }) =>
        count === 1
          ? "Paskutinis 1 u\u017Era\u0161as"
          : count < 10
            ? `Paskutiniai ${count} u\u017Era\u0161ai`
            : `Paskutiniai ${count} u\u017Era\u0161\u0173`,
    },
    error: {
      title: "Nerasta",
      notFound:
        "Arba \u0161is puslapis yra pasiekiamas tik tam tikriems vartotojams, arba tokio puslapio n\u0117ra.",
      home: "Gr\u012F\u017Eti \u012F pagrindin\u012F puslap\u012F",
    },
    folderContent: {
      folder: "Aplankas",
      itemsUnderFolder: ({ count }) =>
        count === 1
          ? "1 elementas \u0161iame aplanke."
          : count < 10
            ? `${count} elementai \u0161iame aplanke.`
            : `${count} element\u0173 \u0161iame aplanke.`,
    },
    tagContent: {
      tag: "\u017Dyma",
      tagIndex: "\u017Dym\u0173 indeksas",
      itemsUnderTag: ({ count }) =>
        count === 1
          ? "1 elementas su \u0161ia \u017Eyma."
          : count < 10
            ? `${count} elementai su \u0161ia \u017Eyma.`
            : `${count} element\u0173 su \u0161ia \u017Eyma.`,
      showingFirst: ({ count }) =>
        count < 10
          ? `Rodomos pirmosios ${count} \u017Eymos.`
          : `Rodomos pirmosios ${count} \u017Eym\u0173.`,
      totalTags: ({ count }) =>
        count === 1
          ? "Rasta i\u0161 viso 1 \u017Eyma."
          : count < 10
            ? `Rasta i\u0161 viso ${count} \u017Eymos.`
            : `Rasta i\u0161 viso ${count} \u017Eym\u0173.`,
    },
  },
}

// ../../i18n/locales/fi-FI.ts
var fi_FI_default = {
  propertyDefaults: {
    title: "Nimet\xF6n",
    description: "Ei kuvausta saatavilla",
  },
  components: {
    callout: {
      note: "Merkint\xE4",
      abstract: "Tiivistelm\xE4",
      info: "Info",
      todo: "Teht\xE4v\xE4lista",
      tip: "Vinkki",
      success: "Onnistuminen",
      question: "Kysymys",
      warning: "Varoitus",
      failure: "Ep\xE4onnistuminen",
      danger: "Vaara",
      bug: "Virhe",
      example: "Esimerkki",
      quote: "Lainaus",
    },
    backlinks: {
      title: "Takalinkit",
      noBacklinksFound: "Takalinkkej\xE4 ei l\xF6ytynyt",
    },
    themeToggle: {
      lightMode: "Vaalea tila",
      darkMode: "Tumma tila",
    },
    readerMode: {
      title: "Lukijatila",
    },
    explorer: {
      title: "Selain",
    },
    footer: {
      createdWith: "Luotu k\xE4ytt\xE4en",
    },
    graph: {
      title: "Verkkon\xE4kym\xE4",
    },
    recentNotes: {
      title: "Viimeisimm\xE4t muistiinpanot",
      seeRemainingMore: ({ remaining }) => `N\xE4yt\xE4 ${remaining} lis\xE4\xE4 \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `Upote kohteesta ${targetSlug}`,
      linkToOriginal: "Linkki alkuper\xE4iseen",
    },
    search: {
      title: "Haku",
      searchBarPlaceholder: "Hae jotain",
    },
    tableOfContents: {
      title: "Sis\xE4llysluettelo",
    },
    contentMeta: {
      readingTime: ({ minutes }) => `${minutes} min lukuaika`,
    },
  },
  pages: {
    rss: {
      recentNotes: "Viimeisimm\xE4t muistiinpanot",
      lastFewNotes: ({ count }) => `Viimeiset ${count} muistiinpanoa`,
    },
    error: {
      title: "Ei l\xF6ytynyt",
      notFound: "T\xE4m\xE4 sivu on joko yksityinen tai sit\xE4 ei ole olemassa.",
      home: "Palaa etusivulle",
    },
    folderContent: {
      folder: "Kansio",
      itemsUnderFolder: ({ count }) =>
        count === 1 ? "1 kohde t\xE4ss\xE4 kansiossa." : `${count} kohdetta t\xE4ss\xE4 kansiossa.`,
    },
    tagContent: {
      tag: "Tunniste",
      tagIndex: "Tunnisteluettelo",
      itemsUnderTag: ({ count }) =>
        count === 1
          ? "1 kohde t\xE4ll\xE4 tunnisteella."
          : `${count} kohdetta t\xE4ll\xE4 tunnisteella.`,
      showingFirst: ({ count }) => `N\xE4ytet\xE4\xE4n ensimm\xE4iset ${count} tunnistetta.`,
      totalTags: ({ count }) => `L\xF6ytyi yhteens\xE4 ${count} tunnistetta.`,
    },
  },
}

// ../../i18n/locales/nb-NO.ts
var nb_NO_default = {
  propertyDefaults: {
    title: "Uten navn",
    description: "Ingen beskrivelse angitt",
  },
  components: {
    callout: {
      note: "Notis",
      abstract: "Abstrakt",
      info: "Info",
      todo: "Husk p\xE5",
      tip: "Tips",
      success: "Suksess",
      question: "Sp\xF8rsm\xE5l",
      warning: "Advarsel",
      failure: "Feil",
      danger: "Farlig",
      bug: "Bug",
      example: "Eksempel",
      quote: "Sitat",
    },
    backlinks: {
      title: "Tilbakekoblinger",
      noBacklinksFound: "Ingen tilbakekoblinger funnet",
    },
    themeToggle: {
      lightMode: "Lys modus",
      darkMode: "M\xF8rk modus",
    },
    readerMode: {
      title: "L\xE6semodus",
    },
    explorer: {
      title: "Utforsker",
    },
    footer: {
      createdWith: "Laget med",
    },
    graph: {
      title: "Graf-visning",
    },
    recentNotes: {
      title: "Nylige notater",
      seeRemainingMore: ({ remaining }) => `Se ${remaining} til \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `Transkludering of ${targetSlug}`,
      linkToOriginal: "Lenke til original",
    },
    search: {
      title: "S\xF8k",
      searchBarPlaceholder: "S\xF8k etter noe",
    },
    tableOfContents: {
      title: "Oversikt",
    },
    contentMeta: {
      readingTime: ({ minutes }) => `${minutes} min lesning`,
    },
  },
  pages: {
    rss: {
      recentNotes: "Nylige notat",
      lastFewNotes: ({ count }) => `Siste ${count} notat`,
    },
    error: {
      title: "Ikke funnet",
      notFound: "Enten er denne siden privat eller s\xE5 finnes den ikke.",
      home: "Returner til hovedsiden",
    },
    folderContent: {
      folder: "Mappe",
      itemsUnderFolder: ({ count }) =>
        count === 1 ? "1 gjenstand i denne mappen." : `${count} gjenstander i denne mappen.`,
    },
    tagContent: {
      tag: "Tagg",
      tagIndex: "Tagg Indeks",
      itemsUnderTag: ({ count }) =>
        count === 1 ? "1 gjenstand med denne taggen." : `${count} gjenstander med denne taggen.`,
      showingFirst: ({ count }) => `Viser f\xF8rste ${count} tagger.`,
      totalTags: ({ count }) => `Fant totalt ${count} tagger.`,
    },
  },
}

// ../../i18n/locales/id-ID.ts
var id_ID_default = {
  propertyDefaults: {
    title: "Tanpa Judul",
    description: "Tidak ada deskripsi",
  },
  components: {
    callout: {
      note: "Catatan",
      abstract: "Abstrak",
      info: "Info",
      todo: "Daftar Tugas",
      tip: "Tips",
      success: "Berhasil",
      question: "Pertanyaan",
      warning: "Peringatan",
      failure: "Gagal",
      danger: "Bahaya",
      bug: "Bug",
      example: "Contoh",
      quote: "Kutipan",
    },
    backlinks: {
      title: "Tautan Balik",
      noBacklinksFound: "Tidak ada tautan balik ditemukan",
    },
    themeToggle: {
      lightMode: "Mode Terang",
      darkMode: "Mode Gelap",
    },
    readerMode: {
      title: "Mode Pembaca",
    },
    explorer: {
      title: "Penjelajah",
    },
    footer: {
      createdWith: "Dibuat dengan",
    },
    graph: {
      title: "Tampilan Grafik",
    },
    recentNotes: {
      title: "Catatan Terbaru",
      seeRemainingMore: ({ remaining }) => `Lihat ${remaining} lagi \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `Transklusi dari ${targetSlug}`,
      linkToOriginal: "Tautan ke asli",
    },
    search: {
      title: "Cari",
      searchBarPlaceholder: "Cari sesuatu",
    },
    tableOfContents: {
      title: "Daftar Isi",
    },
    contentMeta: {
      readingTime: ({ minutes }) => `${minutes} menit baca`,
    },
  },
  pages: {
    rss: {
      recentNotes: "Catatan terbaru",
      lastFewNotes: ({ count }) => `${count} catatan terakhir`,
    },
    error: {
      title: "Tidak Ditemukan",
      notFound: "Halaman ini bersifat privat atau tidak ada.",
      home: "Kembali ke Beranda",
    },
    folderContent: {
      folder: "Folder",
      itemsUnderFolder: ({ count }) =>
        count === 1 ? "1 item di bawah folder ini." : `${count} item di bawah folder ini.`,
    },
    tagContent: {
      tag: "Tag",
      tagIndex: "Indeks Tag",
      itemsUnderTag: ({ count }) =>
        count === 1 ? "1 item dengan tag ini." : `${count} item dengan tag ini.`,
      showingFirst: ({ count }) => `Menampilkan ${count} tag pertama.`,
      totalTags: ({ count }) => `Ditemukan total ${count} tag.`,
    },
  },
}

// ../../i18n/locales/kk-KZ.ts
var kk_KZ_default = {
  propertyDefaults: {
    title: "\u0410\u0442\u0430\u0443\u0441\u044B\u0437",
    description:
      "\u0421\u0438\u043F\u0430\u0442\u0442\u0430\u043C\u0430 \u0431\u0435\u0440\u0456\u043B\u043C\u0435\u0433\u0435\u043D",
  },
  components: {
    callout: {
      note: "\u0415\u0441\u043A\u0435\u0440\u0442\u0443",
      abstract: "\u0410\u043D\u043D\u043E\u0442\u0430\u0446\u0438\u044F",
      info: "\u0410\u049B\u043F\u0430\u0440\u0430\u0442",
      todo: "\u0406\u0441\u0442\u0435\u0443 \u043A\u0435\u0440\u0435\u043A",
      tip: "\u041A\u0435\u04A3\u0435\u0441",
      success: "\u0421\u04D9\u0442\u0442\u0456\u043B\u0456\u043A",
      question: "\u0421\u04B1\u0440\u0430\u049B",
      warning: "\u0415\u0441\u043A\u0435\u0440\u0442\u0443",
      failure: "\u049A\u0430\u0442\u0435",
      danger: "\u049A\u0430\u0443\u0456\u043F",
      bug: "\u049A\u0430\u0442\u0435",
      example: "\u041C\u044B\u0441\u0430\u043B",
      quote: "\u0414\u04D9\u0439\u0435\u043A\u0441\u04E9\u0437",
    },
    backlinks: {
      title:
        "\u0410\u0440\u0442\u049B\u0430 \u0441\u0456\u043B\u0442\u0435\u043C\u0435\u043B\u0435\u0440",
      noBacklinksFound:
        "\u0410\u0440\u0442\u049B\u0430 \u0441\u0456\u043B\u0442\u0435\u043C\u0435\u043B\u0435\u0440 \u0442\u0430\u0431\u044B\u043B\u043C\u0430\u0434\u044B",
    },
    themeToggle: {
      lightMode: "\u0416\u0430\u0440\u044B\u049B \u0440\u0435\u0436\u0438\u043C\u0456",
      darkMode: "\u049A\u0430\u0440\u0430\u04A3\u0493\u044B \u0440\u0435\u0436\u0438\u043C",
    },
    readerMode: {
      title: "\u041E\u049B\u0443 \u0440\u0435\u0436\u0438\u043C\u0456",
    },
    explorer: {
      title: "\u0417\u0435\u0440\u0442\u0442\u0435\u0443\u0448\u0456",
    },
    footer: {
      createdWith:
        "\u049A\u04B1\u0440\u0430\u0441\u0442\u044B\u0440\u044B\u043B\u0493\u0430\u043D \u049B\u04B1\u0440\u0430\u043B:",
    },
    graph: {
      title: "\u0413\u0440\u0430\u0444 \u043A\u04E9\u0440\u0456\u043D\u0456\u0441\u0456",
    },
    recentNotes: {
      title: "\u0421\u043E\u04A3\u0493\u044B \u0436\u0430\u0437\u0431\u0430\u043B\u0430\u0440",
      seeRemainingMore: ({ remaining }) =>
        `\u0422\u0430\u0493\u044B ${remaining} \u0436\u0430\u0437\u0431\u0430\u043D\u044B \u049B\u0430\u0440\u0430\u0443 \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) =>
        `${targetSlug} \u043A\u0456\u0440\u0456\u0441\u0442\u0456\u0440\u0443`,
      linkToOriginal:
        "\u0411\u0430\u0441\u0442\u0430\u043F\u049B\u044B\u0493\u0430 \u0441\u0456\u043B\u0442\u0435\u043C\u0435",
    },
    search: {
      title: "\u0406\u0437\u0434\u0435\u0443",
      searchBarPlaceholder:
        "\u0411\u0456\u0440\u0434\u0435\u04A3\u0435 \u0456\u0437\u0434\u0435\u0443",
    },
    tableOfContents: {
      title: "\u041C\u0430\u0437\u043C\u04B1\u043D\u044B",
    },
    contentMeta: {
      readingTime: ({ minutes }) => `${minutes} \u043C\u0438\u043D \u043E\u049B\u0443`,
    },
  },
  pages: {
    rss: {
      recentNotes:
        "\u0421\u043E\u04A3\u0493\u044B \u0436\u0430\u0437\u0431\u0430\u043B\u0430\u0440",
      lastFewNotes: ({ count }) =>
        `\u0421\u043E\u04A3\u0493\u044B ${count} \u0436\u0430\u0437\u0431\u0430`,
    },
    error: {
      title: "\u0422\u0430\u0431\u044B\u043B\u043C\u0430\u0434\u044B",
      notFound:
        "\u0411\u04B1\u043B \u0431\u0435\u0442 \u0436\u0435\u043A\u0435 \u043D\u0435\u043C\u0435\u0441\u0435 \u0436\u043E\u049B \u0431\u043E\u043B\u0443\u044B \u043C\u04AF\u043C\u043A\u0456\u043D.",
      home: "\u0411\u0430\u0441\u0442\u044B \u0431\u0435\u0442\u043A\u0435 \u043E\u0440\u0430\u043B\u0443",
    },
    folderContent: {
      folder: "\u049A\u0430\u043B\u0442\u0430",
      itemsUnderFolder: ({ count }) =>
        count === 1
          ? "\u0411\u04B1\u043B \u049B\u0430\u043B\u0442\u0430\u0434\u0430 1 \u044D\u043B\u0435\u043C\u0435\u043D\u0442 \u0431\u0430\u0440."
          : `\u0411\u04B1\u043B \u049B\u0430\u043B\u0442\u0430\u0434\u0430 ${count} \u044D\u043B\u0435\u043C\u0435\u043D\u0442 \u0431\u0430\u0440.`,
    },
    tagContent: {
      tag: "\u0422\u0435\u0433",
      tagIndex: "\u0422\u0435\u0433\u0442\u0435\u0440 \u0438\u043D\u0434\u0435\u043A\u0441\u0456",
      itemsUnderTag: ({ count }) =>
        count === 1
          ? "\u0411\u04B1\u043B \u0442\u0435\u0433\u043F\u0435\u043D 1 \u044D\u043B\u0435\u043C\u0435\u043D\u0442."
          : `\u0411\u04B1\u043B \u0442\u0435\u0433\u043F\u0435\u043D ${count} \u044D\u043B\u0435\u043C\u0435\u043D\u0442.`,
      showingFirst: ({ count }) =>
        `\u0410\u043B\u0493\u0430\u0448\u049B\u044B ${count} \u0442\u0435\u0433 \u043A\u04E9\u0440\u0441\u0435\u0442\u0456\u043B\u0443\u0434\u0435.`,
      totalTags: ({ count }) =>
        `\u0411\u0430\u0440\u043B\u044B\u0493\u044B ${count} \u0442\u0435\u0433 \u0442\u0430\u0431\u044B\u043B\u0434\u044B.`,
    },
  },
}

// ../../i18n/locales/he-IL.ts
var he_IL_default = {
  propertyDefaults: {
    title: "\u05DC\u05DC\u05D0 \u05DB\u05D5\u05EA\u05E8\u05EA",
    description: "\u05DC\u05D0 \u05E1\u05D5\u05E4\u05E7 \u05EA\u05D9\u05D0\u05D5\u05E8",
  },
  direction: "rtl",
  components: {
    callout: {
      note: "\u05D4\u05E2\u05E8\u05D4",
      abstract: "\u05EA\u05E7\u05E6\u05D9\u05E8",
      info: "\u05DE\u05D9\u05D3\u05E2",
      todo: "\u05DC\u05E2\u05E9\u05D5\u05EA",
      tip: "\u05D8\u05D9\u05E4",
      success: "\u05D4\u05E6\u05DC\u05D7\u05D4",
      question: "\u05E9\u05D0\u05DC\u05D4",
      warning: "\u05D0\u05D6\u05D4\u05E8\u05D4",
      failure: "\u05DB\u05E9\u05DC\u05D5\u05DF",
      danger: "\u05E1\u05DB\u05E0\u05D4",
      bug: "\u05D1\u05D0\u05D2",
      example: "\u05D3\u05D5\u05D2\u05DE\u05D4",
      quote: "\u05E6\u05D9\u05D8\u05D5\u05D8",
    },
    backlinks: {
      title: "\u05E7\u05D9\u05E9\u05D5\u05E8\u05D9\u05DD \u05D7\u05D5\u05D6\u05E8\u05D9\u05DD",
      noBacklinksFound:
        "\u05DC\u05D0 \u05E0\u05DE\u05E6\u05D0\u05D5 \u05E7\u05D9\u05E9\u05D5\u05E8\u05D9\u05DD \u05D7\u05D5\u05D6\u05E8\u05D9\u05DD",
    },
    themeToggle: {
      lightMode: "\u05DE\u05E6\u05D1 \u05D1\u05D4\u05D9\u05E8",
      darkMode: "\u05DE\u05E6\u05D1 \u05DB\u05D4\u05D4",
    },
    readerMode: {
      title: "\u05DE\u05E6\u05D1 \u05E7\u05E8\u05D9\u05D0\u05D4",
    },
    explorer: {
      title: "\u05E1\u05D9\u05D9\u05E8",
    },
    footer: {
      createdWith: "\u05E0\u05D5\u05E6\u05E8 \u05D1\u05D0\u05DE\u05E6\u05E2\u05D5\u05EA",
    },
    graph: {
      title: "\u05DE\u05D1\u05D8 \u05D2\u05E8\u05E3",
    },
    recentNotes: {
      title: "\u05D4\u05E2\u05E8\u05D5\u05EA \u05D0\u05D7\u05E8\u05D5\u05E0\u05D5\u05EA",
      seeRemainingMore: ({ remaining }) =>
        `\u05E2\u05D9\u05D9\u05DF \u05D1 ${remaining} \u05E0\u05D5\u05E1\u05E4\u05D9\u05DD \u2192`,
    },
    transcludes: {
      transcludeOf: ({ targetSlug }) => `\u05DE\u05E6\u05D5\u05D8\u05D8 \u05DE ${targetSlug}`,
      linkToOriginal: "\u05E7\u05D9\u05E9\u05D5\u05E8 \u05DC\u05DE\u05E7\u05D5\u05E8\u05D9",
    },
    search: {
      title: "\u05D7\u05D9\u05E4\u05D5\u05E9",
      searchBarPlaceholder: "\u05D7\u05E4\u05E9\u05D5 \u05DE\u05E9\u05D4\u05D5",
    },
    tableOfContents: {
      title: "\u05EA\u05D5\u05DB\u05DF \u05E2\u05E0\u05D9\u05D9\u05E0\u05D9\u05DD",
    },
    contentMeta: {
      readingTime: ({ minutes }) =>
        `${minutes} \u05D3\u05E7\u05D5\u05EA \u05E7\u05E8\u05D9\u05D0\u05D4`,
    },
  },
  pages: {
    rss: {
      recentNotes: "\u05D4\u05E2\u05E8\u05D5\u05EA \u05D0\u05D7\u05E8\u05D5\u05E0\u05D5\u05EA",
      lastFewNotes: ({ count }) =>
        `${count} \u05D4\u05E2\u05E8\u05D5\u05EA \u05D0\u05D7\u05E8\u05D5\u05E0\u05D5\u05EA`,
    },
    error: {
      title: "\u05DC\u05D0 \u05E0\u05DE\u05E6\u05D0",
      notFound:
        "\u05D4\u05E2\u05DE\u05D5\u05D3 \u05D4\u05D6\u05D4 \u05E4\u05E8\u05D8\u05D9 \u05D0\u05D5 \u05DC\u05D0 \u05E7\u05D9\u05D9\u05DD.",
      home: "\u05D7\u05D6\u05E8\u05D4 \u05DC\u05E2\u05DE\u05D5\u05D3 \u05D4\u05D1\u05D9\u05EA",
    },
    folderContent: {
      folder: "\u05EA\u05D9\u05E7\u05D9\u05D9\u05D4",
      itemsUnderFolder: ({ count }) =>
        count === 1
          ? "\u05E4\u05E8\u05D9\u05D8 \u05D0\u05D7\u05D3 \u05EA\u05D7\u05EA \u05EA\u05D9\u05E7\u05D9\u05D9\u05D4 \u05D6\u05D5."
          : `${count} \u05E4\u05E8\u05D9\u05D8\u05D9\u05DD \u05EA\u05D7\u05EA \u05EA\u05D9\u05E7\u05D9\u05D9\u05D4 \u05D6\u05D5.`,
    },
    tagContent: {
      tag: "\u05EA\u05D2\u05D9\u05EA",
      tagIndex: "\u05DE\u05E4\u05EA\u05D7 \u05D4\u05EA\u05D2\u05D9\u05D5\u05EA",
      itemsUnderTag: ({ count }) =>
        count === 1
          ? "\u05E4\u05E8\u05D9\u05D8 \u05D0\u05D7\u05D3 \u05E2\u05DD \u05EA\u05D2\u05D9\u05EA \u05D6\u05D5."
          : `${count} \u05E4\u05E8\u05D9\u05D8\u05D9\u05DD \u05E2\u05DD \u05EA\u05D2\u05D9\u05EA \u05D6\u05D5.`,
      showingFirst: ({ count }) =>
        `\u05DE\u05E8\u05D0\u05D4 \u05D0\u05EA \u05D4-${count} \u05EA\u05D2\u05D9\u05D5\u05EA \u05D4\u05E8\u05D0\u05E9\u05D5\u05E0\u05D5\u05EA.`,
      totalTags: ({ count }) =>
        `${count} \u05EA\u05D2\u05D9\u05D5\u05EA \u05E0\u05DE\u05E6\u05D0\u05D5 \u05E1\u05DA \u05D4\u05DB\u05DC.`,
    },
  },
}

// ../../i18n/index.ts
var TRANSLATIONS = {
  "en-US": en_US_default,
  "en-GB": en_GB_default,
  "fr-FR": fr_FR_default,
  "it-IT": it_IT_default,
  "ja-JP": ja_JP_default,
  "de-DE": de_DE_default,
  "nl-NL": nl_NL_default,
  "nl-BE": nl_NL_default,
  "ro-RO": ro_RO_default,
  "ro-MD": ro_RO_default,
  "ca-ES": ca_ES_default,
  "es-ES": es_ES_default,
  "ar-SA": ar_SA_default,
  "ar-AE": ar_SA_default,
  "ar-QA": ar_SA_default,
  "ar-BH": ar_SA_default,
  "ar-KW": ar_SA_default,
  "ar-OM": ar_SA_default,
  "ar-YE": ar_SA_default,
  "ar-IR": ar_SA_default,
  "ar-SY": ar_SA_default,
  "ar-IQ": ar_SA_default,
  "ar-JO": ar_SA_default,
  "ar-PL": ar_SA_default,
  "ar-LB": ar_SA_default,
  "ar-EG": ar_SA_default,
  "ar-SD": ar_SA_default,
  "ar-LY": ar_SA_default,
  "ar-MA": ar_SA_default,
  "ar-TN": ar_SA_default,
  "ar-DZ": ar_SA_default,
  "ar-MR": ar_SA_default,
  "uk-UA": uk_UA_default,
  "ru-RU": ru_RU_default,
  "ko-KR": ko_KR_default,
  "zh-CN": zh_CN_default,
  "zh-TW": zh_TW_default,
  "vi-VN": vi_VN_default,
  "pt-BR": pt_BR_default,
  "hu-HU": hu_HU_default,
  "fa-IR": fa_IR_default,
  "pl-PL": pl_PL_default,
  "cs-CZ": cs_CZ_default,
  "tr-TR": tr_TR_default,
  "th-TH": th_TH_default,
  "lt-LT": lt_LT_default,
  "fi-FI": fi_FI_default,
  "nb-NO": nb_NO_default,
  "id-ID": id_ID_default,
  "kk-KZ": kk_KZ_default,
  "he-IL": he_IL_default,
}
var defaultTranslation = "en-US"
var i18n = (locale) => TRANSLATIONS[locale ?? defaultTranslation]

// ../components/SiteBrand.tsx
import { jsx as jsx3, jsxs } from "preact/jsx-runtime"
var SiteBrand = ({ fileData, cfg }) => {
  const title = cfg.pageTitle ?? i18n(cfg.locale).propertyDefaults.title
  const baseDir = pathToRoot(fileData.slug)
  const iconPath = joinSegments(baseDir, "static/icon.png")
  return /* @__PURE__ */ jsxs("a", {
    class: "site-brand",
    href: baseDir,
    children: [
      /* @__PURE__ */ jsx3("img", {
        class: "site-brand-icon",
        src: iconPath,
        alt: "",
        width: 40,
        height: 40,
      }),
      /* @__PURE__ */ jsx3("span", { class: "site-brand-title", children: title }),
    ],
  })
}
SiteBrand.css = `
.site-brand {
  display: grid;
  grid-template-columns: 2.5rem max-content;
  align-items: center;
  column-gap: 0.85rem;
  min-width: 0;
  min-height: 2.5rem;
  color: var(--dark);
  line-height: 1;
  white-space: nowrap;
  overflow-wrap: normal;
}

.site-brand:hover {
  color: var(--dark);
}

.site-brand-icon {
  display: block;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.8rem;
  object-fit: cover;
  flex-shrink: 0;
  align-self: center;
}

.site-brand-title {
  display: flex;
  align-items: center;
  font-family: var(--titleFont);
  font-size: clamp(1.2rem, 1rem + 0.9vw, 1.8rem);
  font-weight: 700;
  height: 2.5rem;
  line-height: 2.5rem;
  white-space: nowrap;
  text-wrap: nowrap;
  overflow-wrap: normal;
  margin: 0;
  padding: 0;
  transform: none;
}
`
var SiteBrand_default = () => SiteBrand

// ../components/TopHeader.tsx
import { jsx as jsx4, jsxs as jsxs2 } from "preact/jsx-runtime"
var SiteBrand2 = SiteBrand_default()
var HeaderMenu2 = HeaderMenu_default()
function externalComponent(name) {
  const registered = componentRegistry.get(name)
  if (!registered) return void 0
  if (typeof registered.component === "function") {
    return componentRegistry.instantiate(registered.component, void 0)
  }
  return registered.component
}
var TopHeader = (props) => {
  const Search = externalComponent("search") ?? externalComponent("Search")
  const Darkmode = externalComponent("darkmode") ?? externalComponent("Darkmode")
  const ReaderMode = externalComponent("reader-mode") ?? externalComponent("ReaderMode")
  return /* @__PURE__ */ jsxs2("div", {
    class: "top-header",
    children: [
      /* @__PURE__ */ jsx4("div", {
        class: "top-header-brand",
        children: /* @__PURE__ */ jsx4(SiteBrand2, { ...props }),
      }),
      /* @__PURE__ */ jsx4("div", {
        class: "top-header-menu",
        children: /* @__PURE__ */ jsx4(HeaderMenu2, { ...props }),
      }),
      /* @__PURE__ */ jsx4("div", {
        class: "top-header-search",
        children: Search && /* @__PURE__ */ jsx4(Search, { ...props }),
      }),
      /* @__PURE__ */ jsxs2("div", {
        class: "top-header-actions",
        children: [
          Darkmode && /* @__PURE__ */ jsx4(Darkmode, { ...props }),
          ReaderMode && /* @__PURE__ */ jsx4(ReaderMode, { ...props }),
        ],
      }),
    ],
  })
}
TopHeader.css = concatenateResources(
  SiteBrand2.css,
  HeaderMenu2.css,
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
var TopHeader_default = () => TopHeader

// src/frames/CryunFrame.tsx
import { Fragment, jsx as jsx5, jsxs as jsxs3 } from "preact/jsx-runtime"
var TopHeader2 = TopHeader_default()
function cssText(resource) {
  if (!resource) return ""
  return Array.isArray(resource) ? resource.join("\n") : resource
}
var frameStyle = `
body {
  background:
    radial-gradient(circle at top right, rgba(132, 165, 157, 0.16), transparent 28%),
    linear-gradient(180deg, color-mix(in srgb, var(--light) 84%, white) 0%, var(--light) 100%);
}

:root[saved-theme="dark"] body {
  background:
    radial-gradient(circle at top right, rgba(141, 162, 172, 0.1), transparent 30%),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--light) 98%, #1b1c1e) 0%,
      color-mix(in srgb, var(--light) 94%, #141516) 100%
    );
}

.page[data-frame="cryun"] {
  --layout-gap: 1.35rem;
  --page-surface: color-mix(in srgb, var(--light) 88%, white);
  --page-surface-muted: color-mix(in srgb, var(--light) 76%, white);
  --page-border: color-mix(in srgb, var(--lightgray) 70%, var(--secondary) 10%);
  --page-shadow: 0 28px 60px rgba(27, 33, 48, 0.08), 0 10px 20px rgba(27, 33, 48, 0.05);
  width: min(1460px, calc(100% - 2rem));
  max-width: 1460px;
  margin: 0 auto 3rem;
}

:root[saved-theme="dark"] .page[data-frame="cryun"] {
  --page-surface: color-mix(in srgb, var(--light) 97%, #2b2d2f);
  --page-surface-muted: color-mix(in srgb, var(--light) 94%, #313335);
  --page-border: color-mix(in srgb, var(--lightgray) 82%, var(--secondary) 10%);
  --page-shadow: 0 22px 48px rgba(0, 0, 0, 0.22), 0 10px 22px rgba(0, 0, 0, 0.16);
}

.page[data-frame="cryun"] > #quartz-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(17rem, 20rem);
  grid-template-rows: auto auto auto;
  grid-template-areas:
    "grid-header grid-header"
    "grid-center grid-sidebar-right"
    "grid-footer grid-sidebar-right";
  column-gap: clamp(1.5rem, 2vw, 2.5rem);
  row-gap: var(--layout-gap);
}

.page[data-frame="cryun"] > #quartz-body:has(> .sidebar.right:empty) {
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    "grid-header"
    "grid-center"
    "grid-footer";
}

.page[data-frame="cryun"] > #quartz-body:has(> .sidebar.right:empty) > .sidebar.right {
  display: none;
}

.page[data-frame="cryun"] .page-header {
  grid-area: grid-header;
  width: 100%;
  margin: 1.5rem 0 0;
}

.page[data-frame="cryun"] .center {
  grid-area: grid-center;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  min-width: 0;
}

.page[data-frame="cryun"] .sidebar.right {
  grid-area: grid-sidebar-right;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-self: start;
  position: sticky;
  top: 1.4rem;
  height: fit-content;
  max-height: calc(100vh - 2.5rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 0.2rem;
  box-sizing: border-box;
}

.page[data-frame="cryun"] .sidebar.right > * {
  background: var(--page-surface-muted);
  border: 1px solid var(--page-border);
  border-radius: 1.3rem;
  padding: 1.1rem 1.15rem;
  box-shadow: 0 14px 32px rgba(27, 33, 48, 0.06);
  backdrop-filter: blur(10px);
  width: 100%;
  box-sizing: border-box;
  flex: 0 0 auto;
}

.page[data-frame="cryun"] .center-content,
.page[data-frame="cryun"] .page-footer,
.page[data-frame="cryun"] hr,
.page[data-frame="cryun"] footer {
  width: 100%;
  max-width: none;
}

.page[data-frame="cryun"] .center-content {
  background: var(--page-surface);
  border: 1px solid var(--page-border);
  border-radius: 1.7rem;
  box-shadow: var(--page-shadow);
  overflow: hidden;
  justify-self: stretch;
}

.page[data-frame="cryun"] .center-content > .page-lede {
  margin-top: 0;
  padding: 2.35rem 2.7rem 1.5rem;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--page-surface-muted) 82%, white) 0%,
    var(--page-surface) 100%
  );
  border-bottom: 1px solid color-mix(in srgb, var(--page-border) 88%, transparent);
}

.page[data-frame="cryun"] .center-content > .page-lede:empty {
  display: none;
}

.page[data-frame="cryun"] .center-content > .page-lede > * {
  max-width: 58rem;
  margin-left: auto;
  margin-right: auto;
}

.page[data-frame="cryun"] .center-content > :not(.page-lede).popover-hint {
  margin-top: 0;
  padding: 1.95rem 2.7rem 3.35rem;
  width: 100%;
  box-sizing: border-box;
}

.page[data-frame="cryun"] .center-content > :not(.page-lede).popover-hint > * {
  max-width: 58rem;
  margin-left: auto;
  margin-right: auto;
}

.page[data-frame="cryun"] .center-content > :not(.page-lede).popover-hint > :first-child {
  margin-top: 0;
}

.page[data-frame="cryun"] .center-content:has(> .page-lede:empty) > :not(.page-lede).popover-hint {
  padding-top: 2.6rem;
}

.page[data-frame="cryun"] .page-footer {
  margin-top: 0.5rem;
  align-self: stretch;
}

.page[data-frame="cryun"] hr {
  border: none;
  border-top: 1px solid color-mix(in srgb, var(--lightgray) 82%, transparent);
  margin: 0.75rem auto 0;
  align-self: stretch;
}

.page[data-frame="cryun"] footer {
  grid-area: grid-footer;
  margin-left: 0;
  align-self: stretch;
}

.page[data-frame="cryun"] article {
  font-size: 1.02rem;
  line-height: 1.9;
}

.page[data-frame="cryun"] article p,
.page[data-frame="cryun"] article ul,
.page[data-frame="cryun"] article ol,
.page[data-frame="cryun"] article li {
  line-height: 1.9;
}

.page[data-frame="cryun"] article img {
  display: block;
  max-width: 100%;
  margin: 2rem auto;
  border-radius: 1.15rem;
  box-shadow: 0 20px 45px rgba(27, 33, 48, 0.12);
}

.page[data-frame="cryun"] blockquote {
  margin: 1.4rem 0;
  border-left: 4px solid color-mix(in srgb, var(--secondary) 72%, var(--tertiary));
  padding: 0.9rem 0 0.9rem 1.2rem;
  border-radius: 0 1rem 1rem 0;
  background: color-mix(in srgb, var(--highlight) 88%, white);
}

.page[data-frame="cryun"] pre {
  border-radius: 1rem;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  border: 1px solid color-mix(in srgb, var(--lightgray) 82%, var(--secondary) 8%);
}

.page[data-frame="cryun"] .table-container {
  width: calc(100% - 0.5rem);
  margin: 1.3rem auto 1.9rem;
  padding: 0 0.25rem;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.page[data-frame="cryun"] .table-container > table {
  width: 100%;
  min-width: max-content;
}

@media all and (max-width: 1200px) {
  .page[data-frame="cryun"] > #quartz-body {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "grid-header"
      "grid-center"
      "grid-sidebar-right"
      "grid-footer";
  }

  .page[data-frame="cryun"] .sidebar.right {
    position: initial;
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }
}

@media all and (max-width: 800px) {
  .page[data-frame="cryun"] {
    width: calc(100% - 1rem);
    margin-bottom: 2rem;
  }

  .page[data-frame="cryun"] .page-header {
    margin-top: 1rem;
  }

  .page[data-frame="cryun"] .center-content > .page-lede {
    padding: 1.65rem 1.2rem 1.1rem;
  }

  .page[data-frame="cryun"] .center-content > :not(.page-lede).popover-hint {
    padding: 1.5rem 1.2rem 2.35rem;
  }

  .page[data-frame="cryun"] .center-content,
  .page[data-frame="cryun"] .center-content > :not(.page-lede).popover-hint,
  .page[data-frame="cryun"] .center-content > :not(.page-lede).popover-hint > * {
    min-width: 0;
  }
}
`
var CryunFrame = {
  name: "cryun",
  css: `${cssText(TopHeader2.css)}
${frameStyle}`,
  render({ componentData, beforeBody, pageBody: Content, afterBody, right, footer: Footer }) {
    const renderSlot = (Component) => Component(componentData)
    const Header = TopHeader2
    return /* @__PURE__ */ jsxs3(Fragment, {
      children: [
        /* @__PURE__ */ jsx5("div", { class: "page-header", children: renderSlot(Header) }),
        /* @__PURE__ */ jsxs3("div", {
          class: "center",
          children: [
            /* @__PURE__ */ jsxs3("div", {
              class: "center-content",
              children: [
                /* @__PURE__ */ jsx5("div", {
                  class: "page-lede popover-hint",
                  children: beforeBody.map((BodyComponent) => renderSlot(BodyComponent)),
                }),
                renderSlot(Content),
              ],
            }),
            /* @__PURE__ */ jsx5("hr", {}),
            /* @__PURE__ */ jsx5("div", {
              class: "page-footer",
              children: afterBody.map((BodyComponent) => renderSlot(BodyComponent)),
            }),
          ],
        }),
        /* @__PURE__ */ jsx5("div", {
          class: "right sidebar",
          children: right.map((BodyComponent) => renderSlot(BodyComponent)),
        }),
        renderSlot(Footer),
      ],
    })
  },
}
export { CryunFrame }
