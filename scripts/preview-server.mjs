import fs from "fs"
import http from "http"
import path from "path"
import serveHandler from "serve-handler"

const outputDir = path.resolve(process.argv[2] ?? "public-preview")
const port = Number(process.argv[3] ?? "8082")

if (!fs.existsSync(outputDir)) {
  console.error(`Output directory does not exist: ${outputDir}`)
  process.exit(1)
}

function joinPublic(fp) {
  return path.posix.join(outputDir, fp.replace(/^\/+/, ""))
}

const server = http.createServer(async (req, res) => {
  const originalUrl = req.url ?? "/"
  const pathname = decodeURIComponent(originalUrl.split("?")[0] || "/")

  const serve = async () => {
    await serveHandler(req, res, {
      public: outputDir,
      directoryListing: false,
      cleanUrls: false,
      headers: [
        {
          source: "**/*.*",
          headers: [{ key: "Content-Disposition", value: "inline" }],
        },
        {
          source: "**/*.webp",
          headers: [{ key: "Content-Type", value: "image/webp" }],
        },
        {
          source: "**/*.avif",
          headers: [{ key: "Content-Type", value: "image/avif" }],
        },
      ],
    })
    console.log(`[${res.statusCode}] ${pathname}`)
  }

  const redirect = (location) => {
    res.writeHead(302, { Location: location })
    res.end()
    console.log(`[302] ${pathname} -> ${location}`)
  }

  if (pathname.endsWith("/")) {
    const indexFp = path.posix.join(pathname, "index.html")
    if (fs.existsSync(joinPublic(indexFp))) {
      req.url = indexFp
      return serve()
    }

    let htmlFp = pathname.slice(0, -1)
    if (path.extname(htmlFp) === "") {
      htmlFp += ".html"
    }

    if (fs.existsSync(joinPublic(htmlFp))) {
      return redirect(pathname.slice(0, -1))
    }
  } else {
    let htmlFp = pathname
    if (path.extname(htmlFp) === "") {
      htmlFp += ".html"
    }

    if (fs.existsSync(joinPublic(htmlFp))) {
      req.url = htmlFp
      return serve()
    }

    const indexFp = path.posix.join(pathname, "index.html")
    if (fs.existsSync(joinPublic(indexFp))) {
      return redirect(`${pathname}/`)
    }
  }

  req.url = pathname
  return serve()
})

server.listen(port, () => {
  console.log(`Preview server listening at http://localhost:${port}`)
})
