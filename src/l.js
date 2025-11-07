import ftp from "basic-ftp";
import {
  FTP_HOST,
  FTP_USER,
  FTP_PASS,
  FTP_FOLDER_RECV,
  FTP_FOLDER_SEND,
} from "./util/const.js";

const folderArg = process.argv[2];
const FTP_FOLDER = folderArg === "recv" ? FTP_FOLDER_RECV : FTP_FOLDER_SEND;

async function listFolders() {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASS,
      secure: true, // enables TLS
      secureOptions: { rejectUnauthorized: false }, // ✅ this tells Node to ignore self-signed certs
    });

    console.log(`✅ Connected to ${FTP_HOST}`);
    await client.cd(FTP_FOLDER);

    const items = await client.list();

    // Filter only directories
    const folders = items
      .filter((item) => item.isDirectory)
      .map((item) => item.name);

    if (folders.length === 0) {
      console.log("⚠️  No subfolders found.");
    } else {
      console.log("📁 Folders:");
      folders.forEach((f) => console.log(" -", f));
    }

    return folders;
  } catch (err) {
    console.error("🚨 Error:", err.message);
  } finally {
    client.close();
  }
}

listFolders();
