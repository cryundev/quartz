import assert from "node:assert/strict"
import { test } from "node:test"
import { h } from "preact"
import { render } from "preact-render-to-string"
import { FileTrieNode } from "../../../util/fileTrie"
import type { BuildTimeTrieData } from "../../../util/ctx"
import type { FullSlug, FilePath } from "../../../util/path"
import { ExplorerTree } from "./CryunExplorer"

function entry(slug: string, title: string, unlisted = false): BuildTimeTrieData {
  return { slug: slug as FullSlug, title, filePath: `${slug}.md` as FilePath, unlisted }
}

test("explorer omits unlisted notes and branches with no listed descendants", () => {
  const root = new FileTrieNode<BuildTimeTrieData>([])
  root.add(entry("notes/tree", "트리"))
  root.add(entry("notes/hidden", "숨긴 노트", true))
  root.add(entry("hidden/only", "비표시 주제", true))
  const html = render(h(ExplorerTree, { node: root, current: "notes/tree" as FullSlug }))
  assert.ok(html.includes("트리"))
  assert.ok(!html.includes("숨긴 노트"))
  assert.ok(!html.includes('data-folder="hidden/index"'))
  assert.ok(html.includes('aria-current="page"'))
  // Rendering must not prune the shared Quartz trie.
  assert.equal(root.children.length, 2)
  assert.equal(root.children[0].children.length, 2)
})

test("only the selected folder ancestry opens, with relative links and escaped labels", () => {
  const root = new FileTrieNode<BuildTimeTrieData>([])
  root.add(entry("notes-old/page", "Other"))
  root.add(entry("notes/deep/page", "<script>&제목"))
  const order = root.children.map((node) => node.slug)
  const html = render(h(ExplorerTree, { node: root, current: "notes/deep/page" as FullSlug }))
  assert.ok(html.includes('data-folder="notes/index" data-current="true" open'))
  assert.ok(html.includes('data-folder="notes-old/index" data-current="false"'))
  assert.ok(!html.includes('data-folder="notes-old/index" data-current="false" open'))
  assert.ok(!html.includes("<script>"))
  assert.ok(html.includes("&lt;script"))
  assert.ok(html.includes("&amp;제목"))
  assert.ok(html.includes('href="../../notes-old/page"'))
  assert.deepEqual(
    root.children.map((node) => node.slug),
    order,
  )
})
