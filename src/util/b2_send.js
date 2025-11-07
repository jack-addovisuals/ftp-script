import fs from "fs";
import path from "path";
import { b2_deleteFile, b2_downloadFile, b2_listAllFiles } from "./b2.js";
import {
  BUCKET_FOLDER_SEND,
  FILE_PATTERN_SEND,
  LOCAL_FOLDER_SEND,
} from "./const.js";
import { f2_uploadFile } from "./f2.js";
import { notify } from "./mail.js";

const B2_FOLDER = BUCKET_FOLDER_SEND; // remote folder in bucket
const LOCAL_DIR = LOCAL_FOLDER_SEND; // where files will be saved locally

export async function useB2() {
  const files = await b2_listAllFiles(B2_FOLDER);
  if (files.length === 0) {
    console.log(`⚠️  No files to upload in B2 folder '${B2_FOLDER}'`);
  } else {
    await notify(`📦 Found ${files.length} file(s) in B2 to upload.`);

    for (const key of files) {
      console.log(`Processing file: ${key}`);
      if (!key.endsWith("/")) {
        if (key.includes(FILE_PATTERN_SEND)) {
          // Ensure local dir exists
          if (!fs.existsSync(LOCAL_DIR)) {
            fs.mkdirSync(LOCAL_DIR, { recursive: true });
          }

          // Download from B2
          await b2_downloadFile(key, LOCAL_DIR);

          // Upload
          const file = path.basename(key);
          const ret = await f2_uploadFile(file);
          if (ret) {
            await notify(`✅ Upload successful to FTP for file: ${file}`);
          } else {
            await notify(`😒 Upload to FTP for file: ${file}`);
          }

          // Delete the b2 file
          await b2_deleteFile(key);
        }
      }
    }
  }
}
