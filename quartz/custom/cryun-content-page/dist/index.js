// ../../util/jsx.tsx
import { toJsxRuntime } from "hast-util-to-jsx-runtime"
import { Fragment, jsx, jsxs } from "preact/jsx-runtime"
import { h } from "preact"

// ../../util/trace.ts
import { styleText } from "util"
import process from "process"
import { isMainThread } from "workerpool"
var rootFile = /.*at file:/
function trace(msg, err) {
  let stack = err.stack ?? ""
  const lines = []
  lines.push("")
  lines.push(
    "\n" +
      styleText(["bgRed", "black", "bold"], " ERROR ") +
      "\n\n" +
      styleText("red", ` ${msg}`) +
      (err.message.length > 0 ? `: ${err.message}` : ""),
  )
  let reachedEndOfLegibleTrace = false
  for (const line of stack.split("\n").slice(1)) {
    if (reachedEndOfLegibleTrace) {
      break
    }
    if (!line.includes("node_modules")) {
      lines.push(` ${line}`)
      if (rootFile.test(line)) {
        reachedEndOfLegibleTrace = true
      }
    }
  }
  const traceMsg = lines.join("\n")
  if (!isMainThread) {
    throw new Error(traceMsg)
  } else {
    console.error(traceMsg)
    process.exit(1)
  }
}

// ../../util/jsx.tsx
import { jsx as jsx2 } from "preact/jsx-runtime"
function childrenToString(children) {
  if (typeof children === "string") return children
  if (Array.isArray(children)) return children.map(childrenToString).join("")
  return String(children ?? "")
}
var customComponents = {
  table: (props) =>
    /* @__PURE__ */ jsx2("div", {
      class: "table-container",
      children: /* @__PURE__ */ jsx2("table", { ...props }),
    }),
  style: ({ children, ...rest }) =>
    h("style", { ...rest, dangerouslySetInnerHTML: { __html: childrenToString(children) } }),
  script: ({ children, ...rest }) =>
    h("script", { ...rest, dangerouslySetInnerHTML: { __html: childrenToString(children) } }),
}
function htmlToJsx(fp, tree) {
  try {
    return toJsxRuntime(tree, {
      Fragment,
      jsx,
      jsxs,
      elementAttributeNameCase: "html",
      components: customComponents,
    })
  } catch (e) {
    trace(`Failed to parse Markdown in \`${fp}\` into JSX`, e)
  }
}

// src/components/ContentBody.tsx
import { jsx as jsx3 } from "preact/jsx-runtime"
var ContentBody = ({ fileData, tree }) => {
  const content = htmlToJsx(fileData.filePath, tree)
  const classes = fileData.frontmatter?.cssclasses ?? []
  return /* @__PURE__ */ jsx3("article", { class: classes.join(" "), children: content })
}
var ContentBody_default = () => ContentBody

// src/index.ts
var contentMatcher = ({ slug }) => {
  if (slug.endsWith("/index")) return false
  if (slug.startsWith("tags/")) return false
  return true
}
var CryunContentPage = () => ({
  name: "CryunContentPage",
  priority: 0,
  match: contentMatcher,
  layout: "content",
  body: ContentBody_default,
})
var src_default = CryunContentPage
export { CryunContentPage, src_default as default }
