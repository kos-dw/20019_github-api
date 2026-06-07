// GitHub REST API の代役となる最小モックサーバー（Node 標準 http のみ・追加依存なし）。
// Playwright の webServer から別プロセスで起動し、Next サーバーの fetch 先をここに向ける。
import { createServer } from "node:http";
import { repoDetail, searchResponse } from "./fixtures.mjs";

const PORT = Number(process.env.MOCK_PORT ?? "4000");

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  res.setHeader("Content-Type", "application/json");

  // GET /search/repositories?q=...&page=...&per_page=...
  if (url.pathname === "/search/repositories") {
    res.statusCode = 200;
    res.end(JSON.stringify(searchResponse));
    return;
  }

  // GET /repos/{owner}/{repo}
  if (url.pathname.startsWith("/repos/")) {
    res.statusCode = 200;
    res.end(JSON.stringify(repoDetail));
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ message: "Not Found" }));
});

server.listen(PORT, () => {
  console.log(`[mock] GitHub API mock listening on http://localhost:${PORT}`);
});
