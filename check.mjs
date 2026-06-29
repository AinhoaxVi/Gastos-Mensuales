import { readFileSync } from "node:fs";

const files = ["index.html", "styles.css", "app.js", "manifest.json", "service-worker.js"];

for (const file of files) {
  const content = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  if (!content.trim()) throw new Error(`${file} esta vacio`);
}

JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
for (const asset of ["./styles.css", "./app.js", "./manifest.json"]) {
  if (!html.includes(asset)) throw new Error(`Falta referencia a ${asset}`);
}

console.log("OK");
