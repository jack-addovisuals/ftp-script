import fs from "fs";
import path from "path";
import { f2_uploadFile } from "./util/f2.js";
import {
  FILE_PATTERN_SEND,
  LOCAL_FOLDER_SEND,
  LONG_INTERVAL_MS,
} from "./util/const.js";
import { useB2 } from "./util/b2_send.js";

const LOCAL_DIR = LOCAL_FOLDER_SEND; // where files will be saved locally

async function useLocal() {
  if (!fs.existsSync(LOCAL_DIR)) {
    console.error(`❌ Folder not found: ${LOCAL_DIR}`);
  } else {
    const files = fs
      .readdirSync(LOCAL_DIR)
      .filter((f) => fs.statSync(path.join(LOCAL_DIR, f)).isFile());

    if (files.length === 0) {
      console.log(`⚠️  No files to upload in '${LOCAL_DIR}'`);
    } else {
      console.log(`📦 Found ${files.length} file(s) to upload.`);

      for (const file of files) {
        console.log(`Processing file: ${file}`);
        if (!file.endsWith("/")) {
          if (file.includes(FILE_PATTERN_SEND)) {
            // Upload
            const ret = await f2_uploadFile(file);
            if (ret) {
              console.log(`✅ Upload successful for file: ${file}`);
            } else {
              console.log(`😒 Not sure if it is successful for file: ${file}`);
            }

            // Delete the file locally
            const fullPath = path.join(LOCAL_DIR, file);
            fs.unlinkSync(fullPath);
            console.log(`🗑️  Deleted local file: ${fullPath}`);
          }
        }
      }
    }
  }
}

async function main() {
  while (true) {
    const flag = process.argv[2];
    if (flag === "skip") {
      console.log("⏭️  Skipping B2 cycle as per 'skip' flag.");
      await useLocal();
    } else {
      await useB2();
    }
    console.log("✅ All download/send/delete complete.");
    console.log(`⏳ Waiting ${LONG_INTERVAL_MS / 60 / 1000} min...`);
    await new Promise((res) => setTimeout(res, LONG_INTERVAL_MS));
  }
}

main().catch(console.error);
