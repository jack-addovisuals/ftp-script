import ftp from "basic-ftp";
import {
  FTP_HOST,
  FTP_USER,
  FTP_PASS,
  FTP_FOLDER_RECV,
  FTP_FOLDER_SEND,
} from "./util/const.js";

// Change this to your exact filename or regex pattern
// const FILE_TO_DELETE = "toHT-frKC-1028.7z";
// Or use a regex pattern like: const FILE_PATTERN = /^to.*HT.*-fr.*KC.*\.7z$/i;

export async function deleteFile(filename, folder) {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASS,
      secure: true, // or false if not using FTPS
      secureOptions: { rejectUnauthorized: false }, // allow self-signed
    });

    console.log(`✅ Connected to ${FTP_HOST}`);
    await client.cd(folder);
    console.log(`✅ Entered ${folder}`);

    const files = await client.list();
    const target = files.find((f) => f.name === filename);

    if (!target) {
      console.log(`⚠️  File not found: ${filename}`);
      return;
    }

    await client.remove(filename);
    console.log(`🗑️  Deleted: ${filename}`);
  } catch (err) {
    console.error("🚨 Error:", err.message);
  } finally {
    client.close();
  }
}

async function main() {
  const flag = process.argv[2];
  const filename = process.argv[3];

  if (!flag || !filename) {
    console.log("Usage: node d.js <send | recv> <filename>");
    return;
  }

  const folder = flag === "recv" ? FTP_FOLDER_RECV : FTP_FOLDER_SEND;

  await deleteFile(filename, folder);
}

main();
