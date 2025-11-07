import fs from "fs";
import { NOTIFY_LEVEL_INFO } from "./define.js";
import { sendEmail } from "./gmail.js";
import { GIT_REPO } from "./const.js";

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"));
const version = pkg.version;
const prefix = `[${GIT_REPO}, v${version}]`;

export async function notify(text) {
  console.log(`[v${version}] ${text}`);
  await sendEmail(`${prefix} ${text}`, text, NOTIFY_LEVEL_INFO);
}

export async function debug(text) {
  console.log(`[v${version}] Debug - ${text}`);
  await sendEmail(`${prefix} Debug - ${text}`, text);
}
