"""Append photos to an existing private album. Run with --help for usage."""

import argparse
import hashlib
import json
import os
from pathlib import Path
from tempfile import TemporaryDirectory

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
FORMATS = {".jpg", ".jpeg", ".png", ".webp"}


def add_photos(root, sources, group_title):
    manifest = root / "src/config/memory-album.local.json"
    images = root / "public/memories"
    # An OS lock is released even if the importer is interrupted.
    with manifest.with_suffix(".lock.local").open("a+b") as lock:
        lock.seek(0)
        if os.name == "nt":
            import msvcrt
            msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)

        album = json.loads(manifest.read_text(encoding="utf-8"))
        groups = {group["title"]: group for group in album["groups"]}
        if group_title not in groups:
            raise ValueError("请选择已有分组：" + "、".join(groups))
        known = set()
        for group in groups.values():
            for photo in group["photos"]:
                known.add(photo.get("sourceSha256"))
                known.update(photo.get("duplicateSourceSha256", []))
        files = []
        for source in sources:
            if source.is_dir():
                files.extend(sorted(p for p in source.iterdir() if p.is_file() and p.suffix.lower() in FORMATS))
            elif source.is_file() and source.suffix.lower() in FORMATS:
                files.append(source)
            else:
                raise ValueError(f"图片不存在或格式不支持：{source}")
        if not files:
            raise ValueError("没有找到 JPG、PNG 或 WebP 照片")

        with TemporaryDirectory(dir=manifest.parent) as temp:
            stage = Path(temp)
            (stage / "thumb").mkdir()
            added = []
            for source in files:
                with source.open("rb") as stream:
                    digest = hashlib.sha256(stream.read()).hexdigest()
                    if digest in known:
                        continue
                    stream.seek(0)
                    photo_id = "p-" + digest
                    filename = photo_id + ".webp"
                    with Image.open(stream) as original:
                        mode = "RGBA" if original.has_transparency_data else "RGB"
                        image = ImageOps.exif_transpose(original).convert(mode)
                    image.info.clear()
                    image.thumbnail((1920, 1920), Image.Resampling.LANCZOS)
                    image.save(stage / filename, quality=86)
                    image.convert("RGB").save(stage / (photo_id + ".jpg"), quality=87, optimize=True)
                    groups[group_title]["photos"].append(dict(id=photo_id, width=image.width, height=image.height, sourceSha256=digest))
                    image.thumbnail((480, 480), Image.Resampling.LANCZOS)
                    image.save(stage / "thumb" / filename, quality=76)
                    image.convert("RGB").save(stage / "thumb" / (photo_id + ".jpg"), quality=78, optimize=True)
                known.add(digest)
                added.append(filename)
            if added:
                updated = stage / "album.json"
                updated.write_text(json.dumps(album, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                for filename in added:
                    for variant in (filename, Path(filename).with_suffix(".jpg").name):
                        for path in (Path(variant), Path("thumb") / variant):
                            (stage / path).replace(images / path)
                updated.replace(manifest)
            return len(added), len(files) - len(added)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="将新增照片追加到现有分组，自动生成大图和缩略图")
    parser.add_argument("--group", required=True, help="校园 / 聚在一起 / 路上与日常")
    parser.add_argument("sources", nargs="+", type=Path, help="照片文件或文件夹")
    args = parser.parse_args()
    try:
        added, skipped = add_photos(ROOT, args.sources, args.group)
        print(f"新增 {added} 张，跳过 {skipped} 张重复照片。")
    except (OSError, ValueError) as error:
        parser.exit(1, f"导入失败：{error}\n")
