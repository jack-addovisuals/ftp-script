import ftp from "basic-ftp";
import fs from "fs";
import path from "path";
import cliProgress from "cli-progress";
import {
  FTP_HOST,
  FTP_USER,
  FTP_PASS,
  FTP_FOLDER_SEND,
  LOCAL_FOLDER_SEND,
  LOCAL_FOLDER_RECV,
  FTP_FOLDER_RECV,
  FILE_PATTERN_RECV,
  BUCKET_FOLDER_RECV,
  SHORT_INTERVAL_MS,
  MIDDLE_INTERVAL_MS,
} from "./const.js";
import { b2_uploadFile } from "./b2.js";
import { notify } from "./mail.js";

const FTP_CONFIG = {
  host: FTP_HOST,
  user: FTP_USER,
  password: FTP_PASS,
  secure: true,
  secureOptions: { rejectUnauthorized: false },
};

/**
 * Upload file while a second FTP client monitors remote folder.
 */
export async function f2_uploadFile(filename) {
  const FTP_FOLDER = FTP_FOLDER_SEND;
  const LOCAL_FOLDER = LOCAL_FOLDER_SEND;

  let ret = false;

  const localPath = path.join(LOCAL_FOLDER, filename);
  if (!fs.existsSync(localPath))
    throw new Error(`Local file not found: ${localPath}`);

  const uploader = new ftp.Client();
  const watcher = new ftp.Client();

  uploader.ftp.verbose = false;
  uploader.ftp.passive = false;
  watcher.ftp.verbose = false;

  const totalBytes = fs.statSync(localPath).size;

  const bar = new cliProgress.SingleBar({
    format: `Uploading {filename} [{bar}] {percentage}% | {speed} KB/s`,
    barCompleteChar: "█",
    barIncompleteChar: "░",
    hideCursor: true,
  });

  bar.start(100, 0, { filename, speed: "0" });

  let lastBytes = 0;
  let lastTime = Date.now();

  uploader.trackProgress((info) => {
    const now = Date.now();
    const deltaBytes = info.bytes - lastBytes;
    const deltaTime = (now - lastTime) / 1000 || 1;
    const speedKBs = (deltaBytes / 1024 / deltaTime).toFixed(1);
    const pct = (info.bytes / totalBytes) * 100;
    bar.update(pct, { speed: speedKBs });
    lastBytes = info.bytes;
    lastTime = now;
  });

  try {
    await uploader.access(FTP_CONFIG);
    await watcher.access(FTP_CONFIG);
    await uploader.cd(FTP_FOLDER);
    await watcher.cd(FTP_FOLDER);

    console.log("✅ Connected to FTP. Starting upload and polling...");

    // Start upload (do not await)
    const uploadPromise = uploader
      .uploadFrom(localPath, filename)
      .catch((e) => e);

    // Start watcher loop
    const watchPromise = waitForCheckingFile(watcher, filename);

    // Whichever finishes first: poller stabilization or upload promise ends
    const result = await Promise.race([watchPromise, uploadPromise]);

    if (result?.success) {
      console.log(
        `✅ File stabilized: ${result.remoteName} (${result.size} bytes)`
      );
      ret = true;
    } else {
      console.warn(
        "⚠️  Upload may still be processing — no stable file detected yet."
      );
    }

    // bar.update(100);
    bar.stop();
  } catch (err) {
    bar.stop();
    console.error("❌ Error:", err.message);
  } finally {
    uploader.close();
    watcher.close();
  }

  return ret;
}

/**
 * Waits until `filename` or `filename_checking` appears and stops changing size.
 */
async function waitForCheckingFile(
  client,
  filename,
  interval = SHORT_INTERVAL_MS,
  maxWait = 7200000 // 2hr
) {
  const checkName = `${filename}_checking`;
  let lastSize = -1;
  let stableCount = 0;
  const start = Date.now();

  console.log(`🔍 Watching FTP for ${filename} or ${checkName}`);

  while (Date.now() - start < maxWait) {
    const list = await client.list();
    const target =
      list.find((f) => f.name === filename) ||
      list.find((f) => f.name === checkName);

    if (target) {
      if (target.size === lastSize) stableCount++;
      else stableCount = 0;
      lastSize = target.size;

      if (stableCount >= 2) {
        console.log(
          `✅ Upload is stable now: ${target.name} (${target.size} bytes).`
        );
        return { success: true, remoteName: target.name, size: target.size };
      }
      console.log(`⏳ Found ${target.name} (${target.size} bytes). Waiting...`);
    } else {
      console.log("🚨 File not found yet...");
    }

    console.log(`⏳ Waiting ${interval / 60 / 1000} min...`);

    await new Promise((r) => setTimeout(r, interval));
  }

  console.log(`😒 Upload is still unstable after ${maxWait / 1000 / 1000}m`);
  return { success: false };
}

export async function f2_downloadFile() {
  const FTP_FOLDER = FTP_FOLDER_RECV;
  const LOCAL_FOLDER = LOCAL_FOLDER_RECV;
  const FILE_PATTERN = FILE_PATTERN_RECV;

  const client = new ftp.Client();
  client.ftp.verbose = false;

  // Setup progress bar
  const bar = new cliProgress.SingleBar({
    format: "⬇️  {filename} [{bar}] {percentage}% | {speed} KB/s",
    barCompleteChar: "█",
    barIncompleteChar: "░",
    hideCursor: true,
  });

  let totalBytes = 0;
  let lastBytes = 0;
  let lastTime = Date.now();

  // Track FTP progress
  client.trackProgress((info) => {
    const now = Date.now();
    const deltaBytes = info.bytes - lastBytes;
    const deltaTime = (now - lastTime) / 1000 || 1;
    const speedKBs = (deltaBytes / 1024 / deltaTime).toFixed(1);
    const pct = totalBytes ? (info.bytes / totalBytes) * 100 : 0;
    bar.update(pct, { speed: speedKBs });
    lastBytes = info.bytes;
    lastTime = now;
  });

  try {
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASS,
      secure: true,
      secureOptions: { rejectUnauthorized: false }, // allow self-signed
    });

    console.log(`✅ Connected to ${FTP_HOST}`);
    await client.cd(FTP_FOLDER);

    const fileList = await client.list();
    const matchingFiles = fileList.filter((f) => FILE_PATTERN.test(f.name));

    if (matchingFiles.length === 0) {
      console.log("⚠️  No matching files found.");
      return;
    }

    if (!fs.existsSync(LOCAL_FOLDER)) {
      fs.mkdirSync(LOCAL_FOLDER, { recursive: true });
    }

    for (const file of matchingFiles) {
      const localPath = path.join(LOCAL_FOLDER, file.name);

      let attempt = 0;
      let success = false;
      while (attempt < 3 && !success) {
        attempt++;
        console.log(`📥 Attempt ${attempt} for ${file.name}...`);

        console.log(`⬇️  Downloading ${file.name} → ${localPath}`);

        // initialize for this file
        totalBytes = file.size || 0;
        lastBytes = 0;
        lastTime = Date.now();
        bar.start(100, 0, { filename: file.name, speed: "0" });

        const result = await client.downloadTo(localPath, file.name);
        // Some FTP libraries return void; treat no error as success
        if (result?.success !== false) {
          success = true;
          await notify(
            `✅ Download complete: ${file.name}, attempted ${attempt}`
          );
        } else {
          console.log(
            `🚨 Download failed for file: ${file.name}, attempt ${attempt}`
          );
          if (attempt < 3) {
            console.log("⏳ Waiting 5 minutes before retry...");
            await new Promise((res) => setTimeout(res, MIDDLE_INTERVAL_MS));
          } else {
            await notify(
              `🚨 All download attempts are done for ${file.name}, attempted ${attempt}, upload to b2 will happen now.`
            );
          }
        }
        // bar.update(100, { speed: "0" });
        bar.stop();
      }

      // upload to destination
      await b2_uploadFile(localPath, BUCKET_FOLDER_RECV).catch(console.error);

      // optional delete
      await client.remove(file.name);
      await notify(`🗑️ Deleted ${file.name} from FTP server.`);
    }

    console.log("✅ All download/upload/delete complete.");
  } catch (err) {
    bar.stop();
    console.error("🚨 Error:", err.message);
  } finally {
    client.close();
  }
}
