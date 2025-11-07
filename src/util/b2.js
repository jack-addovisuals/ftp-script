import fs from "fs";
import path from "path";
import AWS from "aws-sdk";
import cliProgress from "cli-progress";
import {
  ACCESS_KEY_ID,
  BUCKET_FOLDER_RECV,
  BUCKET_NAME,
  ENDPOINT,
  REGION,
  SECRET_ACCESS_KEY,
} from "./const.js";
import { notify } from "./mail.js";

const PREFIX = `${BUCKET_FOLDER_RECV.replace(/\/?$/, "/")}`; // e.g. "recv/"

// === Initialize B2 client ===
const b2 = new AWS.S3({
  endpoint: ENDPOINT,
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
  region: REGION,
  signatureVersion: "v4",

  // 🕐 Increase timeouts here (in milliseconds)
  httpOptions: {
    timeout: 20 * 60 * 1000, // 20 minutes
  },
});

export async function b2_listAllFiles(prefix) {
  const allKeys = [];
  let continuationToken;

  do {
    const res = await b2
      .listObjectsV2({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
      .promise();

    if (res.Contents) {
      allKeys.push(...res.Contents.map((obj) => obj.Key));
    }

    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);

  return allKeys.filter((k) => !k.endsWith("/")); // exclude folder placeholders
}

export async function b2_downloadFile(key, localDir) {
  const fileName = key.substring(PREFIX.length); // remove folder prefix
  const localPath = path.join(localDir, fileName);
  const dirName = path.dirname(localPath);

  // ensure subdirectories exist
  fs.mkdirSync(dirName, { recursive: true });

  console.log(`\n⬇️  Downloading: ${key}`);

  // start download with progress bar
  const res = await b2
    .getObject({
      Bucket: BUCKET_NAME,
      Key: key,
    })
    .promise();

  const fileSize = res.ContentLength || res.Body.length;
  const progressBar = new cliProgress.SingleBar(
    {
      format: `Downloading [{bar}] {percentage}% | {value}/{total} bytes`,
      barCompleteChar: "█",
      barIncompleteChar: "░",
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  );

  progressBar.start(fileSize, 0);

  fs.writeFileSync(localPath, res.Body);
  progressBar.update(fileSize);
  progressBar.stop();

  console.log(`✅ Saved: ${localPath}`);
}

export async function b2_uploadFile(filePath, folderName) {
  const fileName = path.basename(filePath);
  const remoteKey = `${folderName}${fileName}`;
  const fileSize = fs.statSync(filePath).size;

  console.log(
    `\n⏫ Uploading: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`
  );

  const fileStream = fs.createReadStream(filePath);

  // Set up progress bar
  const progressBar = new cliProgress.SingleBar(
    {
      format: `Uploading [{bar}] {percentage}% | {value}/{total} bytes`,
      barCompleteChar: "█",
      barIncompleteChar: "░",
      hideCursor: true,
    },
    cliProgress.Presets.shades_classic
  );

  progressBar.start(fileSize, 0);

  let uploadedBytes = 0;
  fileStream.on("data", (chunk) => {
    uploadedBytes += chunk.length;
    progressBar.update(uploadedBytes);
  });

  try {
    const res = await b2
      .upload({
        Bucket: BUCKET_NAME,
        Key: remoteKey,
        Body: fileStream,
      })
      .promise();

    progressBar.update(fileSize);
    progressBar.stop();
    await notify(`✅ Uploaded: ${fileName}`);
    console.log(
      "📍 Location:",
      res.Location || `(check bucket ${BUCKET_NAME})`
    );

    // Delete the file locally after successful upload
    fs.unlinkSync(filePath);
    console.log(`🗑️  Deleted local file: ${fileName}`);
  } catch (err) {
    progressBar.stop();
    console.error(`❌ Failed to upload ${fileName}:`, err.message);
  }
}

export async function b2_deleteFiles(keys) {
  const CHUNK_SIZE = 1000; // AWS S3 API limit for batch delete
  for (let i = 0; i < keys.length; i += CHUNK_SIZE) {
    const chunk = keys.slice(i, i + CHUNK_SIZE);
    const objects = chunk.map((Key) => ({ Key }));

    console.log(`🗑️  Deleting ${objects.length} files...`);

    await b2
      .deleteObjects({
        Bucket: BUCKET_NAME,
        Delete: { Objects: objects },
      })
      .promise();
  }
}

export async function b2_deleteFile(key) {
  try {
    console.log(`🗑️ Deleting file: ${key} ...`);

    await b2
      .deleteObject({
        Bucket: BUCKET_NAME,
        Key: key,
      })
      .promise();

    console.log(`✅ File deleted: ${key}`);
  } catch (err) {
    console.error("❌ Error deleting file:", err.message);
  }
}
