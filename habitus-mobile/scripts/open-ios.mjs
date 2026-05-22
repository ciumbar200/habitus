#!/usr/bin/env node
/**
 * Abre Expo en el primer simulador iPhone disponible y limpia caché de dispositivo obsoleto.
 */
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

try {
  execSync("xcrun simctl delete unavailable", { stdio: "ignore" });
} catch {
  /* ignore */
}

let deviceName = "iPhone 17";
try {
  const raw = execSync("xcrun simctl list devices available -j", { encoding: "utf8" });
  const parsed = JSON.parse(raw);
  for (const runtime of Object.keys(parsed.devices ?? {})) {
    const phones = (parsed.devices[runtime] ?? []).filter(
      (d) => d.isAvailable && /iPhone/i.test(d.name),
    );
    if (phones.length > 0) {
      deviceName = phones[0].name;
      break;
    }
  }
} catch {
  /* fallback name */
}

const devicesFile = path.join(root, ".expo", "devices.json");
fs.mkdirSync(path.dirname(devicesFile), { recursive: true });
fs.writeFileSync(devicesFile, '{"devices":[]}\n');

console.log(`Simulador: ${deviceName}`);

const child = spawn("npx", ["expo", "start", "--ios"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, EXPO_IOS_SIMULATOR_DEVICE_NAME: deviceName },
});

child.on("exit", (code) => process.exit(code ?? 0));
