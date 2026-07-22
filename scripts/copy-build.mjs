import { copyFile, mkdir, rename, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const source = resolve(root, ".openai", "hosting.json");
const destinationDirectory = resolve(root, "dist", ".openai");
const destination = resolve(destinationDirectory, "hosting.json");
const serverEntrypoint = resolve(root, "dist", "server", "index.js");
const serverHandler = resolve(root, "dist", "server", "handler.js");

if (!destinationDirectory.startsWith(resolve(root, "dist") + "/")) {
  throw new Error("Refusing to write outside the project directory.");
}

await stat(source);
await mkdir(destinationDirectory, { recursive: true });
await copyFile(source, destination);

// Render the single-page app at build time, then package a minimal module
// worker. The browser hydrates the included client bundle, so all configurator
// controls remain interactive without depending on SSR in the worker runtime.
const serverModule = await import(pathToFileURL(serverEntrypoint).href);
const renderedResponse = await serverModule.default(
  new Request("https://diehls-truck-configurator.invalid/")
);

if (!renderedResponse.ok) {
  throw new Error(`Unable to prerender the homepage (${renderedResponse.status}).`);
}

const renderedHtml = await renderedResponse.text();
await rename(serverEntrypoint, serverHandler);
await writeFile(
  serverEntrypoint,
  `const html = ${JSON.stringify(renderedHtml)};\n\n` +
    `export default {\n` +
    `  async fetch(request) {\n` +
    `    const url = new URL(request.url);\n` +
    `    if (url.pathname !== "/") {\n` +
    `      return new Response("Not Found", { status: 404 });\n` +
    `    }\n` +
    `    return new Response(request.method === "HEAD" ? null : html, {\n` +
    `      status: 200,\n` +
    `      headers: {\n` +
    `        "Content-Type": "text/html; charset=utf-8",\n` +
    `        "Cache-Control": "public, max-age=60"\n` +
    `      }\n` +
    `    });\n` +
    `  }\n` +
    `};\n`,
  "utf8"
);
