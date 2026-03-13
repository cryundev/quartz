import { Components, Jsx, toJsxRuntime } from "hast-util-to-jsx-runtime"
import { Node, Root } from "hast"
import { ComponentChildren, VNode, toChildArray } from "preact"
import { Fragment, jsx, jsxs } from "preact/jsx-runtime"
import { trace } from "./trace"
import { type FilePath } from "./path"

const DEFAULT_TABLE_MIN_SHARE = 0.18
const MIN_TABLE_SCORE = 7
const MAX_TABLE_SCORE = 48

function isVNode(node: ComponentChildren): node is VNode {
  return typeof node === "object" && node !== null && "type" in node && "props" in node
}

function extractText(node: ComponentChildren): string {
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

function measureText(text: string): number {
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

function collectRows(node: ComponentChildren): ComponentChildren[][] {
  const rows: ComponentChildren[][] = []

  const visit = (child: ComponentChildren) => {
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

    const tagName = typeof child.type === "string" ? child.type : undefined

    if (tagName === "tr") {
      const cells = toChildArray(child.props.children).filter((cell): cell is VNode => {
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

function calculateColumnWidths(children: ComponentChildren): number[] | undefined {
  const rows = collectRows(children)
  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 0)

  if (columnCount === 0) {
    return undefined
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

const customComponents: Components = {
  table: ({ children, ...props }) => {
    const columnWidths = calculateColumnWidths(children)

    return (
      <div class="table-container">
        <table {...props} data-column-count={columnWidths?.length}>
          {columnWidths && (
            <colgroup>
              {columnWidths.map((width, index) => (
                <col key={`table-col-${index}`} style={{ width: `${width}%` }} />
              ))}
            </colgroup>
          )}
          {children}
        </table>
      </div>
    )
  },
}

export function htmlToJsx(fp: FilePath, tree: Node) {
  try {
    return toJsxRuntime(tree as Root, {
      Fragment,
      jsx: jsx as Jsx,
      jsxs: jsxs as Jsx,
      elementAttributeNameCase: "html",
      components: customComponents,
    })
  } catch (e) {
    trace(`Failed to parse Markdown in \`${fp}\` into JSX`, e as Error)
  }
}
