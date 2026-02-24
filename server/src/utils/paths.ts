import path from "path";

// Detect whether we're running compiled code in dist/ or source code in src/
const isCompiled = __dirname.includes(path.join("dist", "src"));

export const PROJECT_ROOT = isCompiled
  ? path.resolve(__dirname, "../../../..")
  : path.resolve(__dirname, "../../..");

// Directory where user-uploaded files are stored
export const UPLOADS_DIR = path.join(PROJECT_ROOT, "uploads");

// Vite build output served in production
export const CLIENT_DIST_DIR = path.join(PROJECT_ROOT, "client", "dist");

// SSL certificate directory
export const SSL_DIR = path.join(PROJECT_ROOT, "ssl");


export function envFilePath(env?: string): string {
  const filename = env === "test" ? ".env.test" : ".env";
  return path.join(PROJECT_ROOT, filename);
}
