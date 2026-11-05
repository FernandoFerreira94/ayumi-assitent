// Backup diário: pg_dump → gzip → Bucket S3 (Railway). Rodar como cron do Railway: `pnpm backup`.
import { spawn } from "node:child_process";
import { createGzip } from "node:zlib";
import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { backupKey, expiredKeys } from "../src/lib/backup";
import { log } from "../src/lib/log";

const need = (n: string) => {
  const v = process.env[n];
  if (!v) throw new Error(`${n} não configurada`);
  return v;
};

async function main() {
  const db = need("DATABASE_URL");
  const bucket = need("BACKUP_BUCKET");
  const keepDays = Number(process.env.BACKUP_KEEP_DAYS ?? 14);
  const s3 = new S3Client({
    region: process.env.BACKUP_REGION ?? "auto",
    endpoint: need("BACKUP_ENDPOINT"),
    forcePathStyle: true,
    credentials: { accessKeyId: need("BACKUP_ACCESS_KEY_ID"), secretAccessKey: need("BACKUP_SECRET_ACCESS_KEY") },
  });

  const now = new Date();
  const key = backupKey(now);
  const dump = spawn("pg_dump", ["--no-owner", "--no-privileges", db], { stdio: ["ignore", "pipe", "inherit"] });
  const exited = new Promise<number>((res) => dump.on("close", (c) => res(c ?? 1)));
  await new Upload({ client: s3, params: { Bucket: bucket, Key: key, Body: dump.stdout.pipe(createGzip()) } }).done();
  if ((await exited) !== 0) throw new Error("pg_dump falhou");
  log("info", "backup_ok", { key });

  // retenção
  const listed = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: "backups/" }));
  const old = expiredKeys((listed.Contents ?? []).map((o) => o.Key!).filter(Boolean), now, keepDays);
  if (old.length) {
    await s3.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: old.map((Key) => ({ Key })) } }));
    log("info", "backup_pruned", { removed: old.length });
  }
}

main().catch((e) => {
  log("error", "backup_failed", { err: String(e) });
  process.exit(1);
});
