import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { copyFile, cp } from "node:fs/promises";
import path from "node:path";
import { deflateRawSync } from "node:zlib";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src");
const DIST = path.join(ROOT, "dist");
const EXTRA_FILES = ["README.md", "PRIVACY.md"];
const ZIP_TIMESTAMP = new Date("2024-01-01T00:00:00Z");

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < CRC_TABLE.length; i += 1) {
  let value = i;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  CRC_TABLE[i] = value >>> 0;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosDate, dosTime };
}

function uint16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function uint32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0);
  return buffer;
}

async function copySource(target) {
  rmSync(target, { recursive: true, force: true });
  await cp(SRC, target, { recursive: true });

  for (const filename of EXTRA_FILES) {
    const source = path.join(ROOT, filename);
    if (existsSync(source)) {
      await copyFile(source, path.join(target, filename));
    }
  }
}

function listFiles(root) {
  const files = [];
  const walk = (directory) => {
    for (const name of readdirSync(directory).sort()) {
      const absolutePath = path.join(directory, name);
      const stats = statSync(absolutePath);
      if (stats.isDirectory()) {
        walk(absolutePath);
      } else if (stats.isFile()) {
        files.push(absolutePath);
      }
    }
  };
  walk(root);
  return files;
}

function zipDirectory(sourceDir, archivePath) {
  rmSync(archivePath, { force: true });

  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const filePath of listFiles(sourceDir)) {
    const relativePath = path.relative(sourceDir, filePath).split(path.sep).join("/");
    const nameBuffer = Buffer.from(relativePath);
    const content = readFileSync(filePath);
    const compressed = deflateRawSync(content);
    const checksum = crc32(content);
    const { dosDate, dosTime } = dosDateTime(ZIP_TIMESTAMP);

    const localHeader = Buffer.concat([
      uint32(0x04034b50),
      uint16(20),
      uint16(0x0800),
      uint16(8),
      uint16(dosTime),
      uint16(dosDate),
      uint32(checksum),
      uint32(compressed.length),
      uint32(content.length),
      uint16(nameBuffer.length),
      uint16(0),
      nameBuffer
    ]);

    const centralHeader = Buffer.concat([
      uint32(0x02014b50),
      uint16(20),
      uint16(20),
      uint16(0x0800),
      uint16(8),
      uint16(dosTime),
      uint16(dosDate),
      uint32(checksum),
      uint32(compressed.length),
      uint32(content.length),
      uint16(nameBuffer.length),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(offset),
      nameBuffer
    ]);

    localParts.push(localHeader, compressed);
    centralParts.push(centralHeader);
    offset += localHeader.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endRecord = Buffer.concat([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(centralParts.length),
    uint16(centralParts.length),
    uint32(centralDirectory.length),
    uint32(offset),
    uint16(0)
  ]);

  const archive = Buffer.concat([...localParts, centralDirectory, endRecord]);
  writeFileSync(archivePath, archive);
  return createHash("sha256").update(archive).digest("hex");
}

const manifest = JSON.parse(readFileSync(path.join(SRC, "manifest.json"), "utf8"));
const version = manifest.version;

mkdirSync(DIST, { recursive: true });
for (const name of readdirSync(DIST)) {
  if (/^PureTab-.*\.(zip|xpi)$/.test(name)) {
    rmSync(path.join(DIST, name), { force: true });
  }
}

const chromeDir = path.join(DIST, "chrome");
const firefoxDir = path.join(DIST, "firefox");
await copySource(chromeDir);
await copySource(firefoxDir);

const artifacts = [
  [chromeDir, path.join(DIST, `PureTab-${version}-chrome.zip`)],
  [firefoxDir, path.join(DIST, `PureTab-${version}-firefox.xpi`)]
];

const checksumLines = [];
for (const [sourceDir, archivePath] of artifacts) {
  const digest = zipDirectory(sourceDir, archivePath);
  checksumLines.push(`${digest}  ${path.basename(archivePath)}`);
  console.log(`${digest}  ${archivePath}`);
}

writeFileSync(path.join(DIST, "checksums.txt"), `${checksumLines.join("\n")}\n`);
