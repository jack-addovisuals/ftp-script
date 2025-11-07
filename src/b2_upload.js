import fs from "fs";
import path from "path";

import { BUCKET_FOLDER_SEND, LOCAL_FOLDER_SEND } from "./util/const.js";
import { b2_uploadFile } from "./util/b2.js";

const LOCAL_DIR = LOCAL_FOLDER_SEND;
const REMOTE_PREFIX = BUCKET_FOLDER_SEND;

async function main() {
  if (!fs.existsSync(LOCAL_DIR)) {
    console.error(`❌ Folder not found: ${LOCAL_DIR}`);
    return;
  }

  const files = fs
    .readdirSync(LOCAL_DIR)
    .filter((f) => fs.statSync(path.join(LOCAL_DIR, f)).isFile());

  if (files.length === 0) {
    console.log(`⚠️  No files to upload in '${LOCAL_DIR}'`);
    return;
  }

  console.log(`📦 Found ${files.length} file(s) to upload.`);

  for (const file of files) {
    const fullPath = path.join(LOCAL_DIR, file);
    await b2_uploadFile(fullPath, REMOTE_PREFIX);
  }

  console.log("\n✅ All uploads complete!");
}

// Run
main().catch(console.error);
