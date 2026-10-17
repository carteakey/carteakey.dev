#!/usr/bin/env node
// Local stand-in for `netlify dev` when working on agentcart (/ask/): serves
// the built `_site/` and routes POST /api/ask to the edge function, so the
// terminal works end to end. Build first (`npm run build:11ty` + build:css).
//
//   ASK_ROUTE=local LOCAL_LLM_URL=http://localhost:8080/v1 \
//   LOCAL_LLM_TOKEN=$LLAMA_SWAP_API_KEY PORT=8094 node utils/ask-dev-server.mjs
//
// Same env vars as production (docs/AGENTCART.md). Without Upstash vars the
// usage limit and queue are off; use /ask/?preview=limit|queue|down instead.
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import "dotenv/config";
import handler from "../netlify/edge-functions/ask.js";

const SITE = path.resolve("_site");
const PORT = Number(process.env.PORT || 8094);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff2": "font/woff2",
};
process.env.ASK_CORPUS_ORIGIN ||= `http://localhost:${PORT}`;

async function serveFile(res, file) {
  const data = await readFile(file);
  res.writeHead(200, {
    "content-type": TYPES[path.extname(file)] || "application/octet-stream",
  });
  res.end(data);
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (url.pathname === "/api/ask") {
      let body = "";
      for await (const chunk of req) body += chunk;
      const response = await handler(
        new Request(url, {
          method: req.method,
          headers: req.headers,
          body: req.method === "POST" ? body : undefined,
        }),
        { ip: "127.0.0.1" },
      );
      res.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body) Readable.fromWeb(response.body).pipe(res);
      else res.end();
      return;
    }

    const file = path.join(SITE, decodeURIComponent(url.pathname));
    if (!file.startsWith(SITE)) {
      res.writeHead(403).end();
      return;
    }
    try {
      await serveFile(res, file.endsWith("/") ? `${file}index.html` : file);
    } catch {
      try {
        await serveFile(res, path.join(file, "index.html"));
      } catch {
        res.writeHead(404).end("404");
      }
    }
  })
  .listen(PORT, () =>
    console.log(`agentcart dev server: http://localhost:${PORT}/ask/`),
  );
