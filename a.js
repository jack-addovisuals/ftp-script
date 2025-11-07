import { useB2 } from "./src/util/b2_send.js";
import { LONG_INTERVAL_MS } from "./src/util/const.js";
import { f2_downloadFile } from "./src/util/f2.js";
import { debug } from "./src/util/mail.js";

let iteration = 0;

async function main() {
  await new Promise((res) => setTimeout(res, 3000));

  console.log(process.env);
  while (true) {
    iteration++;
    debug(`🔄 Iteration ${iteration} ...\n`);
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

main().catch(console.error);
