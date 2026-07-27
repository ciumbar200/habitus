import { readdir, rm, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiRoot = path.join(appRoot, "_api");
const outRoot = path.join(appRoot, "server-dist");
const coreEntry = path.resolve(appRoot, "../packages/habitus-core/src/index.ts");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) return walk(absolute);
      return entry.isFile() && entry.name.endsWith(".ts") ? [absolute] : [];
    }),
  );
  return files.flat();
}

function routePath(relativeFile) {
  const withoutExtension = relativeFile.replace(/\.ts$/, "").replace(/\/index$/, "");
  return `/api/${withoutExtension}`.replace(/\[([^\]]+)\]/g, ":$1");
}

function routeScore(route) {
  const segments = route.split("/");
  const dynamicSegments = segments.filter((segment) => segment.startsWith(":")).length;
  return dynamicSegments * 100 - segments.length;
}

await rm(outRoot, { recursive: true, force: true });
await mkdir(path.join(outRoot, "api"), { recursive: true });

const handlerFiles = (await walk(apiRoot))
  .filter((file) => !file.includes(`${path.sep}_lib${path.sep}`))
  .sort();

const entryPoints = Object.fromEntries(
  handlerFiles.map((file) => {
    const relative = path.relative(apiRoot, file).split(path.sep).join("/");
    return [`api/${relative.replace(/\.ts$/, "")}`, file];
  }),
);

await build({
  entryPoints,
  outdir: outRoot,
  outbase: appRoot,
  entryNames: "[dir]/[name]",
  chunkNames: "chunks/[name]-[hash]",
  outExtension: { ".js": ".mjs" },
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "node",
  target: "node22",
  packages: "external",
  alias: {
    "@habitus/core": coreEntry,
  },
  sourcemap: true,
  logLevel: "info",
});

await build({
  entryPoints: [path.join(appRoot, "server/index.ts")],
  outfile: path.join(outRoot, "server.mjs"),
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  packages: "external",
  sourcemap: true,
  logLevel: "info",
});

const routes = handlerFiles
  .map((file) => {
    const relative = path.relative(apiRoot, file).split(path.sep).join("/");
    return {
      path: routePath(relative),
      module: `./api/${relative.replace(/\.ts$/, ".mjs")}`,
    };
  })
  .sort((left, right) => routeScore(left.path) - routeScore(right.path));

await writeFile(
  path.join(outRoot, "routes.json"),
  `${JSON.stringify(routes, null, 2)}\n`,
  "utf8",
);

console.log(`Coolify server compiled with ${routes.length} API routes.`);
