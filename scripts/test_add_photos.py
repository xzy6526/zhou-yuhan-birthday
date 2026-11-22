import json
import runpy
import tempfile
import unittest
from pathlib import Path

from PIL import Image

add_photos = runpy.run_path(str(Path(__file__).with_name("add-photos.py")))["add_photos"]


class PhotoImportTest(unittest.TestCase):
    def test_batch_failure_retry_and_portrait_orientation(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            manifest = root / "src/config/memory-album.local.json"
            manifest.parent.mkdir(parents=True)
            manifest.write_text('{"featured":[],"groups":[{"title":"校园","photos":[]}]}', encoding="utf-8")
            media = root / "public/memories"
            (media / "thumb").mkdir(parents=True)
            src = root / "portrait.jpg"
            orientation = Image.Exif()
            orientation[274] = 6
            Image.new("RGB", (2200, 1100)).save(src, exif=orientation)
            broken = root / "broken.jpg"
            broken.write_bytes(b"invalid image")

            before = manifest.read_bytes()
            with self.assertRaises(OSError):
                add_photos(root, [src, broken], "校园")
            self.assertEqual(manifest.read_bytes(), before)
            self.assertEqual(list(media.rglob("*.webp")), [])
            self.assertEqual(add_photos(root, [src], "校园"), (1, 0))
            self.assertEqual(add_photos(root, [src], "校园"), (0, 1))
            photo, = json.loads(manifest.read_text(encoding="utf-8"))["groups"][0]["photos"]
            filename = photo["id"] + ".webp"
            for path, size in [(media / filename, (960, 1920)), (media / "thumb" / filename, (240, 480))]:
                for variant in (path, path.with_suffix(".jpg")):
                    with Image.open(variant) as image:
                        self.assertEqual(image.size, size)
                        self.assertFalse(image.getexif())


if __name__ == "__main__":
    unittest.main()
