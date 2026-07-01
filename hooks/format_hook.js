// PostToolUse hook (Edit|Write): auto-format the edited file with Prettier.
// Runs the correct app's Prettier (FE/ or BE/) on just that one file, using
// that app's own .prettierrc + .prettierignore. Never blocks the edit — any
// problem (no match, Prettier missing, parse error) just exits 0 silently.
process.stdin.setEncoding("utf8");
let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  const { spawnSync } = require("child_process");
  const fs = require("fs");
  const path = require("path");

  let filePath = "";
  try {
    filePath = JSON.parse(input).tool_input?.file_path || "";
  } catch {
    process.exit(0);
  }
  if (!filePath) process.exit(0);

  // Only format files that belong to one of the two apps (FE/ or BE/).
  const normalized = filePath.replace(/\\/g, "/");
  const match = normalized.match(/^(.*\/(?:FE|BE))\//);
  if (!match) process.exit(0);
  const appRoot = match[1];

  // Use the app's locally-installed Prettier; skip silently if absent.
  const binDir = path.join(appRoot, "node_modules", ".bin");
  const bin = fs.existsSync(path.join(binDir, "prettier.cmd"))
    ? path.join(binDir, "prettier.cmd")
    : path.join(binDir, "prettier");
  if (!fs.existsSync(bin)) process.exit(0);

  // --ignore-unknown: skip files Prettier has no parser for (and respect
  // .prettierignore) without erroring.
  spawnSync(bin, ["--write", "--ignore-unknown", filePath], {
    cwd: appRoot,
    stdio: "ignore",
  });
  process.exit(0);
});
