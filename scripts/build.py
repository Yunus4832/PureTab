#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
DIST = ROOT / "dist"
EXTRA_FILES = ("README.md", "PRIVACY.md")


def copy_source(target: Path) -> None:
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(SRC, target)

    for filename in EXTRA_FILES:
        source = ROOT / filename
        if source.exists():
            shutil.copy2(source, target / filename)


def zip_dir(source_dir: Path, archive_path: Path) -> str:
    if archive_path.exists():
        archive_path.unlink()

    with ZipFile(archive_path, "w", ZIP_DEFLATED) as archive:
        for path in sorted(source_dir.rglob("*")):
            if path.is_file():
                archive.write(path, path.relative_to(source_dir))

    digest = hashlib.sha256(archive_path.read_bytes()).hexdigest()
    return digest


def main() -> None:
    manifest = json.loads((SRC / "manifest.json").read_text(encoding="utf-8"))
    version = manifest["version"]

    DIST.mkdir(exist_ok=True)
    for archive in DIST.glob("PureTab-*"):
        if archive.is_file() and archive.suffix in {".zip", ".xpi"}:
            archive.unlink()

    chrome_dir = DIST / "chrome"
    firefox_dir = DIST / "firefox"
    copy_source(chrome_dir)
    copy_source(firefox_dir)

    artifacts = [
        (chrome_dir, DIST / f"PureTab-{version}-chrome.zip"),
        (firefox_dir, DIST / f"PureTab-{version}-firefox.xpi"),
    ]

    checksum_lines = []
    for source_dir, archive_path in artifacts:
        digest = zip_dir(source_dir, archive_path)
        checksum_lines.append(f"{digest}  {archive_path.name}")
        print(f"{digest}  {archive_path}")

    (DIST / "checksums.txt").write_text("\n".join(checksum_lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
