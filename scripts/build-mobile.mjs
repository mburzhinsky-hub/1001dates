import { cp, copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const file of ["styles-final.css", "engine-v14.js", "engine.js", "manifest.webmanifest"]) {
  await copyFile(path.join(root, file), path.join(dist, file));
}

for (const dir of ["data", "assets"]) {
  await cp(path.join(root, dir), path.join(dist, dir), { recursive: true });
}

await copyFile(path.join(root, "mobile", "index.html"), path.join(dist, "index.html"));

const source = await readFile(path.join(root, "mobile", "app-final.js"), "utf8");
const swRegistration = "if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js?v=final3',{updateViaCache:'none'}).catch(()=>{});";
await writeFile(path.join(dist, "app-final.js"), source.replace(swRegistration, ""), "utf8");

console.log("Android web bundle built in dist/");
