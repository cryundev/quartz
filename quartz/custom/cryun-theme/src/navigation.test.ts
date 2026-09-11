import assert from "node:assert/strict"
import { test } from "node:test"
import type { QuartzPluginData } from "../../../plugins/vfile"
import type { FilePath, FullSlug } from "../../../util/path"
import { getNavigationSections } from "./navigation"

function note(slug: string, title: string, modified = "2026-01-01"): QuartzPluginData {
  const date = new Date(modified)
  return {
    slug: slug as FullSlug,
    filePath: `content/${slug}.md` as FilePath,
    frontmatter: { title, tags: [] },
    dates: { created: date, modified: date, published: date },
  }
}

test("navigation uses published notes, excluding unlisted files and virtual pages", () => {
  const hidden = { ...note("hidden/secret", "비공개"), unlisted: true }
  const virtual = { slug: "404" as FullSlug, frontmatter: { title: "404", tags: [] } }
  const input = [note("index", "홈"), note("math/vector", "벡터"), hidden, virtual]
  const sections = getNavigationSections(input)
  assert.deepEqual(
    sections.map((section) => section.segment),
    ["math"],
  )
})

test("folder metadata names sections without counting index pages twice", () => {
  const sections = getNavigationSections([
    note("02_data/index", "자료구조"),
    note("02_data/tree", "트리"),
    note("10_math/vector", "벡터"),
    note("02_data/deep/index", "중첩 폴더"),
    note("02_data/deep/graph", "그래프"),
  ])
  assert.deepEqual(
    sections.map((section) => section.title),
    ["자료구조", "math"],
  )
  assert.equal(sections[0].slug, "02_data/index")
})

test("navigation preserves shared file order and data", () => {
  const older = note("math/old", "오래된 문서", "2025-01-01")
  const newer = note("math/new", "새 문서", "2026-09-01")
  const input = [older, newer]
  const before = structuredClone(input)
  const sections = getNavigationSections(input)
  assert.deepEqual(input, before)
  assert.equal(getNavigationSections(input), sections)
  assert.notEqual(getNavigationSections([...input]), sections)
})

test("an empty site has no synthetic counts or links", () => {
  assert.deepEqual(getNavigationSections([note("index", "홈")]), [])
})
