export async function ensureEnv(vars: string[]) {
  const missingVars = vars.filter((v) => !(v in process.env));
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`,
    );
  }
}
