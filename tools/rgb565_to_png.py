#!/usr/bin/env python3
"""Convert img_*.h RGB565 pixel data to PNG files in images/ directory."""

import re
import os
from PIL import Image

TRANSPARENT_COLOR = 0xF81F  # Magenta used as transparency key


def rgb565_to_rgba(value):
    """Convert RGB565 16-bit value to RGBA tuple."""
    if value == TRANSPARENT_COLOR:
        return (0, 0, 0, 0)
    r = ((value >> 11) & 0x1F) * 255 // 31
    g = ((value >> 5) & 0x3F) * 255 // 63
    b = (value & 0x1F) * 255 // 31
    return (r, g, b, 255)


def parse_header(filepath):
    """Parse .h file and return (width, height, pixels list)."""
    with open(filepath, "r") as f:
        content = f.read()

    width_match = re.search(r"#define\s+\w+_WIDTH\s+(\d+)", content)
    height_match = re.search(r"#define\s+\w+_HEIGHT\s+(\d+)", content)
    if not width_match or not height_match:
        raise ValueError(f"Could not find WIDTH/HEIGHT in {filepath}")

    width = int(width_match.group(1))
    height = int(height_match.group(1))

    hex_values = re.findall(r"0x[0-9A-Fa-f]+", content)
    pixels = [int(v, 16) for v in hex_values]

    expected = width * height
    if len(pixels) != expected:
        raise ValueError(
            f"Expected {expected} pixels, got {len(pixels)} in {filepath}"
        )

    return width, height, pixels


def convert(header_path, output_path):
    """Convert a single .h file to PNG."""
    width, height, pixels = parse_header(header_path)
    img = Image.new("RGBA", (width, height))
    img.putdata([rgb565_to_rgba(p) for p in pixels])
    img.save(output_path)
    print(f"  {os.path.basename(header_path)} -> {output_path} ({width}x{height})")


def main():
    # Project root is one level up from tools/
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    images_dir = os.path.join(base_dir, "images")
    os.makedirs(images_dir, exist_ok=True)

    import glob
    header_files = sorted(glob.glob(os.path.join(base_dir, "img_*.h")))

    if not header_files:
        print("No img_*.h files found.")
        return

    print(f"Converting {len(header_files)} file(s) to images/...")
    for hf in header_files:
        name = os.path.splitext(os.path.basename(hf))[0]  # e.g. img_apto
        output = os.path.join(images_dir, f"{name}.png")
        convert(hf, output)

    print("Done.")


if __name__ == "__main__":
    main()
