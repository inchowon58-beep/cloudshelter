/**
 * 구름이네(cloudshelter) 전용 배포 가드
 * 제주감귤(jejumilgam)로 push/deploy 되는 것을 막습니다.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const vercelPath = path.join(root, ".vercel", "project.json");

function fail(msg) {
  console.error("\n❌ 배포 중단 — " + msg);
  console.error("이 프로젝트는 cloudshelter(구름이네) 전용입니다.");
  console.error("제주감귤(jejumilgam)로는 절대 push/deploy 하지 마세요.\n");
  process.exit(1);
}

if (!fs.existsSync(vercelPath)) {
  fail(".vercel/project.json 없음. 먼저: npx vercel link --project cloudshelter --yes");
}

const vercel = JSON.parse(fs.readFileSync(vercelPath, "utf8"));
if (vercel.projectName !== "cloudshelter") {
  fail(
    `Vercel 연결이 '${vercel.projectName}' 입니다. cloudshelter 만 허용됩니다.\n` +
      `해결: npx vercel link --project cloudshelter --yes`
  );
}

let remote = "";
try {
  remote = execSync("git remote get-url origin", { cwd: root, encoding: "utf8" }).trim();
} catch {
  fail("git origin remote를 읽을 수 없습니다.");
}

if (!/cloudshelter\.git/i.test(remote)) {
  fail(`git origin이 cloudshelter가 아닙니다:\n  ${remote}`);
}
if (/jejumilgam/i.test(remote)) {
  fail(`git origin에 jejumilgam이 들어 있습니다:\n  ${remote}`);
}

console.log("✅ 배포 대상 확인: Vercel=cloudshelter, Git=cloudshelter");
