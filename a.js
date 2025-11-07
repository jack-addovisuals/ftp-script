import { useB2 } from "./src/util/b2_send.js";
import { LONG_INTERVAL_MS } from "./src/util/const.js";
import { f2_downloadFile } from "./src/util/f2.js";
import { debug } from "./src/util/mail.js";

const IS_GITHUB_ACTION = true;

let iteration = 0;

async function main() {
  await new Promise((res) => setTimeout(res, 3000));

  const now = new Date();
  const chinaTime = now.toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour12: false,
  });

  if (IS_GITHUB_ACTION) {
    debug(`🔄 [${chinaTime}] GitHub Action started ...\n`);
    console.log("🚀 Starting B2 file operations...\n");
    // try to send files
    await useB2();

    console.log("\n🚀 Starting F2 file operations...\n");
    // try to receive files
    await f2_downloadFile();
  } else {
    while (true) {
      iteration++;
      debug(`🔄 [${chinaTime}] Iteration ${iteration} ...\n`);
      console.log("🚀 Starting B2 file operations...\n");
      // try to send files
      await useB2();

      console.log("\n🚀 Starting F2 file operations...\n");
      // try to receive files
      await f2_downloadFile();

      console.log(`\n⏳ Waiting ${LONG_INTERVAL_MS / 60 / 1000} min...`);
      await new Promise((res) => setTimeout(res, LONG_INTERVAL_MS));
    }
  }
}

main().catch(console.error);
