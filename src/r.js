import { LONG_INTERVAL_MS } from "./util/const.js";
import { f2_downloadFile } from "./util/f2.js";

async function receive() {
  await f2_downloadFile();
}

async function main() {
  const arg = process.argv[2];

  if (arg === "get") {
    await receive();
  } else {
    while (true) {
      await receive();
      console.log(`⏳ Waiting ${LONG_INTERVAL_MS / 60 / 1000} min...`);
      await new Promise((res) => setTimeout(res, LONG_INTERVAL_MS));
    }
  }
}

main();
