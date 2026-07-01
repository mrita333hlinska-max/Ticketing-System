// PreToolUse hook (Edit|Write): protects committed Drizzle migrations.
// Enforces .claude/rules/migrations.md — a fix is always a NEW migration.
// Blocks: any Edit to a file under BE/drizzle/, and any Write that would
// overwrite an existing file there. Creating a NEW migration file is allowed.
process.stdin.setEncoding("utf8");
let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  const fs = require("fs");
  const payload = JSON.parse(input);
  const toolName = payload.tool_name || "";
  const filePath = payload.tool_input?.file_path || "";

  const normalized = filePath.replace(/\\/g, "/");
  const inMigrationDir = /(^|\/)BE\/drizzle\//.test(normalized);

  if (inMigrationDir) {
    const isEdit = toolName === "Edit";
    const overwritingExisting = toolName === "Write" && fs.existsSync(filePath);
    if (isEdit || overwritingExisting) {
      console.error(
        "Blocked: never hand-edit a committed Drizzle migration in BE/drizzle/. " +
          "Change BE/src/db/schema.ts and run `npm run db:generate` to create a NEW " +
          "migration. See .claude/rules/migrations.md.",
      );
      process.exit(2);
    }
  }
  process.exit(0);
});
