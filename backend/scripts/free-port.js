import { execSync } from "node:child_process";

const port = process.env.PORT || 5000;

if (process.platform === "win32") {
  const ps =
    process.env.SystemRoot
      ? `${process.env.SystemRoot}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`
      : "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
  try {
    execSync(
      `"${ps}" -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -EA SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -EA SilentlyContinue }"`,
      { stdio: "inherit" }
    );
  } catch {
    // port already free
  }
} else {
  try {
    execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: "inherit" });
  } catch {
    // port already free
  }
}
