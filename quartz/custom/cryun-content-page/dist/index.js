// ../../util/jsx.tsx
import { toJsxRuntime } from "hast-util-to-jsx-runtime"
import { Fragment, jsx, jsxs } from "preact/jsx-runtime"
import { h, toChildArray } from "preact"

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
import { jsx as jsx2, jsxs as jsxs2 } from "preact/jsx-runtime"
var DEFAULT_TABLE_MIN_SHARE = 0.18
var MIN_TABLE_SCORE = 7
var MAX_TABLE_SCORE = 48
function childrenToString(children) {
  if (typeof children === "string") return children
  if (Array.isArray(children)) return children.map(childrenToString).join("")
  return String(children ?? "")
}
function isVNode(node) {
  return typeof node === "object" && node !== null && "type" in node && "props" in node
}
function extractText(node) {
  if (node == null || typeof node === "boolean") {
    return ""
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
  }
  if (Array.isArray(node)) {
    return node.map((child) => extractText(child)).join(" ")
  }
  if (isVNode(node)) {
    return extractText(node.props.children)
  }
  return ""
}
function measureText(text) {
  const normalized = text.replace(/\s+/g, " ").trim()
  if (normalized.length === 0) {
    return 0
  }
  return Array.from(normalized).reduce((score, char) => {
    if (/\s/.test(char)) {
      return score + 0.35
    }
    return score + (/[\u1100-\u11ff\u2e80-\u9fff\uac00-\ud7af]/.test(char) ? 1.65 : 1)
  }, 0)
}
function collectRows(node) {
  const rows = []
  const visit = (child) => {
    if (child == null || typeof child === "boolean") {
      return
    }
    if (Array.isArray(child)) {
      for (const nestedChild of child) {
        visit(nestedChild)
      }
      return
    }
    if (!isVNode(child)) {
      return
    }
    const tagName = typeof child.type === "string" ? child.type : void 0
    if (tagName === "tr") {
      const cells = toChildArray(child.props.children).filter((cell) => {
        return isVNode(cell) && (cell.type === "th" || cell.type === "td")
      })
      if (cells.length > 0) {
        rows.push(cells.map((cell) => cell.props.children))
      }
      return
    }
    visit(child.props.children)
  }
  visit(node)
  return rows
}
function calculateColumnWidths(children) {
  const rows = collectRows(children)
  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0)
  if (columnCount === 0) {
    return void 0
  }
  const scores = Array.from({ length: columnCount }, () => MIN_TABLE_SCORE)
  for (const row of rows) {
    row.forEach((cell, index) => {
      const cellScore = Math.max(
        MIN_TABLE_SCORE,
        Math.min(MAX_TABLE_SCORE, measureText(extractText(cell))),
      )
      scores[index] = Math.max(scores[index], cellScore)
    })
  }
  const minShare = Math.min(DEFAULT_TABLE_MIN_SHARE, 0.9 / columnCount)
  const widths = Array.from({ length: columnCount }, () => 0)
  const remaining = new Set(scores.keys())
  let remainingShare = 1
  while (remaining.size > 0) {
    const remainingIndexes = [...remaining]
    const remainingScore = remainingIndexes.reduce((sum, index) => sum + scores[index], 0)
    if (remainingScore <= 0) {
      const equalShare = remainingShare / remainingIndexes.length
      for (const index of remainingIndexes) {
        widths[index] = equalShare
      }
      break
    }
    let lockedColumn = false
    for (const index of remainingIndexes) {
      const share = (remainingShare * scores[index]) / remainingScore
      if (share < minShare) {
        widths[index] = minShare
        remainingShare -= minShare
        remaining.delete(index)
        lockedColumn = true
      }
    }
    if (!lockedColumn) {
      for (const index of remainingIndexes) {
        widths[index] = (remainingShare * scores[index]) / remainingScore
      }
      break
    }
  }
  const percentages = widths.map((width) => Number((width * 100).toFixed(3)))
  const totalPercentage = percentages.reduce((sum, width) => sum + width, 0)
  const difference = Number((100 - totalPercentage).toFixed(3))
  percentages[percentages.length - 1] += difference
  return percentages
}
var customComponents = {
  table: ({ children, ...props }) => {
    const columnWidths = calculateColumnWidths(children)
    return /* @__PURE__ */ jsx2("div", {
      class: "table-container",
      children: /* @__PURE__ */ jsxs2("table", {
        ...props,
        "data-column-count": columnWidths?.length,
        children: [
          columnWidths &&
            /* @__PURE__ */ jsx2("colgroup", {
              children: columnWidths.map((width, index) =>
                /* @__PURE__ */ jsx2(
                  "col",
                  { style: { width: `${width}%` } },
                  `table-col-${index}`,
                ),
              ),
            }),
          children,
        ],
      }),
    })
  },
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
