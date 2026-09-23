#!/usr/bin/env python3
"""Rebuild the bundled Natural Earth basemap. No runtime tile service or API key.

Requires ImageMagick for the raster conversion; Python uses only its stdlib.
Run explicitly when updating the source version, not at server startup.
"""
import hashlib
import io
import json
import math
from pathlib import Path
import subprocess
import tempfile
from urllib.request import urlopen
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "client/public/atlas/base"
VECTOR_VERSION = "v5.1.2"
BASE = f"https://raw.githubusercontent.com/nvkelso/natural-earth-vector/{VECTOR_VERSION}/geojson/"
FILES = {
    "land": "ne_110m_land.geojson",
    "countries": "ne_50m_admin_0_countries.geojson",
    "rivers": "ne_50m_rivers_lake_centerlines.geojson",
    "lakes": "ne_50m_lakes.geojson",
    "cities": "ne_50m_populated_places.geojson",
}
KEEP = {"NAME", "NAME_EN", "name", "NAMEPAR", "ADM0NAME", "SOVEREIGNT", "TYPE", "FEATURECLA", "POP_MAX"}


def fetch(url):
    with urlopen(url, timeout=120) as response:
        return response.read()


def round_coordinates(value):
    if isinstance(value, list):
        return [round_coordinates(v) for v in value]
    return round(value, 5) if isinstance(value, float) else value


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    records = []
    for name, filename in FILES.items():
        url = BASE + filename
        raw = fetch(url)
        data = json.loads(raw)
        for feature in data["features"]:
            feature["properties"] = {k: v for k, v in feature["properties"].items() if k in KEEP}
            feature["geometry"]["coordinates"] = round_coordinates(feature["geometry"]["coordinates"])
        path = OUT / f"{name}.geojson"
        path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
        records.append({"file": path.name, "url": url, "sourceSha256": hashlib.sha256(raw).hexdigest(),
                        "packagedSha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                        "features": len(data["features"])})
        print(path.name, path.stat().st_size, flush=True)

    url = "https://naturalearth.s3.amazonaws.com/50m_raster/NE1_50M_SR_W.zip"
    raw = fetch(url)
    with tempfile.TemporaryDirectory(prefix="atlas-raster-") as tmp:
        archive = zipfile.ZipFile(io.BytesIO(raw))
        member = next(n for n in archive.namelist() if n.lower().endswith(".tif"))
        tif = Path(tmp) / "relief.tif"
        tif.write_bytes(archive.read(member))
        width, height = 3072, 1536
        pixels = subprocess.check_output(["magick", str(tif), "-resize", f"{width}x{height}!",
                                          "-alpha", "off", "-depth", "8", "rgb:-"])
        # Reproject equirectangular input rows to Web Mercator. Raster image source
        # corners must be ±85.0511287798066, not ±90 degrees.
        output_height = 3072
        ppm = Path(tmp) / "mercator.ppm"
        with ppm.open("wb") as output:
            output.write(f"P6\n{width} {output_height}\n255\n".encode())
            for row in range(output_height):
                y = math.pi * (1 - 2 * (row + 0.5) / output_height)
                lat = math.degrees(math.atan(math.sinh(y)))
                source_row = max(0, min(height - 1, int((90 - lat) / 180 * height)))
                offset = source_row * width * 3
                output.write(pixels[offset:offset + width * 3])
        path = OUT / "relief.jpg"
        subprocess.run(["magick", str(ppm), "-quality", "80", str(path)], check=True)
        records.append({"file": path.name, "url": url, "sourceSha256": hashlib.sha256(raw).hexdigest(),
                        "packagedSha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                        "projection": "EPSG:3857", "latitudeLimit": 85.0511287798066,
                        "note": "Natural Earth I shaded relief: illustrative modern physical base, not ancient terrain."})
    (OUT / "provenance.json").write_text(json.dumps({
        "source": "Natural Earth", "license": "Public domain",
        "licenseUrl": "https://www.naturalearthdata.com/about/terms-of-use/",
        "vectorVersion": VECTOR_VERSION, "files": records,
        "caution": "Modern boundaries are generalized cartographic conventions, not a statement of sovereignty. No street-level detail."
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()