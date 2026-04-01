import type { Request, Response } from "express";
import { openApiSpec } from "src/docs/openapi.js";

const renderDocCard = (method: string, path: string, summary?: string) => {
  const color = method === "GET" ? "#3b82f6" : method === "POST" ? "#22c55e" : method === "PATCH" ? "#f59e0b" : "#ef4444";

  return `
    <div style="border:1px solid #263244;border-radius:16px;padding:18px 20px;background:#101826;">
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
        <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${color};color:#08111f;font-weight:700;font-size:12px;">${method}</span>
        <code style="font-size:14px;color:#e5eefb;">${path}</code>
      </div>
      <p style="margin:12px 0 0;color:#9fb2cb;font-size:14px;">${summary ?? ""}</p>
    </div>
  `;
};

export const getOpenApiSpec = (_req: Request, res: Response) => {
  return res.json(openApiSpec);
};

export const getDocsPage = (_req: Request, res: Response) => {
  const cards = Object.entries(openApiSpec.paths)
    .flatMap(([path, methods]) =>
      Object.entries(methods).map(([method, operation]) =>
        renderDocCard(method.toUpperCase(), `/api${path}`, operation.summary)
      )
    )
    .join("");

  return res
    .type("html")
    .send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Zorvyn Finance API Docs</title>
    <style>
      body{margin:0;background:#0b1220;color:#f8fafc;font-family:Inter,system-ui,sans-serif}
      main{max-width:1100px;margin:0 auto;padding:48px 24px 80px}
      a{color:#7dd3fc}
      .hero{display:grid;gap:16px;margin-bottom:28px}
      .grid{display:grid;gap:16px}
      @media(min-width:900px){.grid{grid-template-columns:1fr 1fr}}
      .panel{border:1px solid #223049;border-radius:20px;background:#0f1729;padding:22px}
      .pill{display:inline-block;padding:6px 12px;border-radius:999px;background:#14213a;color:#90cdf4;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
      code{font-family:"IBM Plex Mono",ui-monospace,monospace}
      ul{color:#9fb2cb}
    </style>
  </head>
  <body>
    <main>
      <div class="hero">
        <span class="pill">OpenAPI</span>
        <h1 style="margin:0;font-size:40px;line-height:1.05;">Zorvyn Finance Dashboard API</h1>
        <p style="margin:0;color:#9fb2cb;font-size:16px;max-width:740px;">A lightweight, browser-friendly documentation page backed by a Swagger-compatible OpenAPI document.</p>
      </div>

      <div class="panel" style="margin-bottom:24px;">
        <h2 style="margin:0 0 12px;">Documentation Links</h2>
        <ul>
          <li><a href="/api/docs.json">OpenAPI JSON</a> for Swagger, Postman, or Hoppscotch import.</li>
          <li><a href="https://editor.swagger.io/">Swagger Editor</a> if you want to preview the JSON visually.</li>
        </ul>
      </div>

      <div class="grid">${cards}</div>
    </main>
  </body>
</html>`);
};
