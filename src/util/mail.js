import fs from "fs";
import { NOTIFY_LEVEL_INFO } from "./define.js";
import { sendEmail } from "./gmail.js";

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"));
const version = pkg.version;

export async function notify(text) {
  console.log(`[v${version}] ${text}`);
  await sendEmail(`[v${version}] ${text}`, text, NOTIFY_LEVEL_INFO);
}

export async function debug(text) {
  console.log(`[v${version}] Debug - ${text}`);
  await sendEmail(`[v${version}] Debug - ${text}`, text);
}
