import AWS from "aws-sdk";
import {
  ACCESS_KEY_ID,
  BUCKET_FOLDER_RECV,
  BUCKET_FOLDER_SEND,
  BUCKET_NAME,
  ENDPOINT,
  REGION,
  SECRET_ACCESS_KEY,
} from "./util/const.js";

// === Get folder argument ===
const folderArg = process.argv[2];
const folderName =
  folderArg === "recv" ? BUCKET_FOLDER_RECV : BUCKET_FOLDER_SEND;
const PREFIX = `${folderName}`; // e.g. "recv/" or "send/"

// === Initialize B2 client ===
const b2 = new AWS.S3({
  endpoint: ENDPOINT,
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
  region: REGION,
  signatureVersion: "v4",
});

async function listFiles(prefix) {
  console.log(`📂 Listing files in folder: ${prefix}`);

  try {
    const res = await b2
      .listObjectsV2({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
      })
      .promise();

    const files = res.Contents || [];
    if (files.length === 0) {
      console.log("⚠️  No files found.");
      return;
    }

    for (const f of files) {
      if (!f.Key.endsWith("/")) {
        const sizeKB = (f.Size / 1024).toFixed(1);
        console.log(`- ${f.Key}  (${sizeKB} KB)`);
      }
    }
    console.log(`✅ Total files: ${files.length}`);
  } catch (err) {
    console.error("❌ Error listing files:", err.message);
  }
}

// Run
listFiles(PREFIX);
