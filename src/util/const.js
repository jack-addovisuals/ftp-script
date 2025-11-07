// import "dotenv/config";

export const FTP_HOST = process.env.FTP_HOST || "";
export const FTP_USER = process.env.FTP_USER || "";
export const FTP_PASS = process.env.FTP_PASS || "";
export const FTP_FOLDER_SEND = process.env.FTP_FOLDER_SEND || "";
export const FTP_FOLDER_RECV = process.env.FTP_FOLDER_RECV || "";

export const MAIL_TO = process.env.MAIL_TO || "";

// Other Config
export const ENDPOINT = "https://s3.us-east-005.backblazeb2.com";
export const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID || "";
export const SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY || "";
export const BUCKET_NAME = "jack-f-script-bucket";
export const REGION = "us-east-005";

export const FILE_PATTERN_RECV = /^to.*HT.*-fr.*KC.*\.7z$/i; // regex for files ending in .7z
export const FILE_PATTERN_SEND = "doc_kp_toKC_frDX";

export const BUCKET_FOLDER_SEND = "send/";
export const BUCKET_FOLDER_RECV = "recv/";
export const LOCAL_FOLDER_SEND = "./uploads";
export const LOCAL_FOLDER_RECV = "./downloads/";

export const SHORT_INTERVAL_MS = 30 * 1000; // 30 seconds
export const MIDDLE_INTERVAL_MS = 5 * 60 * 1000; // 5 min
export const LONG_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

// Gmail
export const MAIL_USER = "jack.addovisuals@gmail.com";
export const MAIL_PASS = process.env.MAIL_PASS || "";
export const MAIL_FROM = '"FTP Script of Lao" <jack.addovisuals@gmail.com>';

export const GIT_REPO = process.env.GITHUB_REPOSITORY || "local-run";
