import fs from "fs";
import { BUCKET_FOLDER_RECV, LOCAL_FOLDER_RECV } from "./util/const.js";
import { b2_downloadFile, b2_listAllFiles } from "./util/b2.js";

const PREFIX = `${BUCKET_FOLDER_RECV.replace(/\/?$/, "/")}`; // e.g. "recv/"
const LOCAL_DIR = LOCAL_FOLDER_RECV;

// === Ensure local directory exists ===
if (!fs.existsSync(LOCAL_DIR)) {
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
}

async function main() {
  console.log(`📂 Listing files under folder '${PREFIX}'...`);
  const files = await b2_listAllFiles(PREFIX);

  if (files.length === 0) {
    console.log("⚠️  No files found.");
    return;
  }

  console.log(`Found ${files.length} file(s) to download.\n`);

  for (const key of files) {
    await b2_downloadFile(key, LOCAL_DIR);
  }

  console.log("\n✅ All downloads complete!");
}

// Run
main().catch((err) => {
  console.error("❌ Error:", err.message);
});
