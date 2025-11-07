import { BUCKET_FOLDER_RECV, BUCKET_FOLDER_SEND } from "./util/const.js";
import { b2_deleteFiles, b2_listAllFiles } from "./util/b2.js";

// === Get folder argument ===
const folderArg = process.argv[2];
const folderName =
  folderArg === "recv" ? BUCKET_FOLDER_RECV : BUCKET_FOLDER_SEND;
const PREFIX = `${folderName}`; // e.g. "recv/" or "send/"

async function main() {
  console.log(`📂 Listing files under folder '${PREFIX}'...`);

  const files = await b2_listAllFiles(PREFIX);
  if (files.length === 0) {
    console.log("⚠️  No files found.");
    return;
  }

  console.log(`Found ${files.length} files. Starting deletion...`);
  await b2_deleteFiles(files);

  console.log(`✅ Successfully deleted all files under '${PREFIX}'`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
});
