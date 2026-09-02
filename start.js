const { spawn } = require("child_process");
const path = require("path");

function run(command, args, label) {
  const proc = spawn(command, args, {
    cwd: path.resolve(__dirname),
    stdio: "inherit",
    shell: true,
  });

  proc.on("error", (err) => {
    console.error(`[${label}] Error:`, err.message);
  });

  proc.on("exit", (code) => {
    console.log(`[${label}] Exited with code ${code}`);
  });

  return proc;
}

console.log("Starting WebSocket server...");
run("npx", ["tsx", "src/server/websocket/server.ts"], "WS");

console.log("Starting Next.js server...");
run("npx", ["next", "start"], "Next.js");
