#!/usr/bin/env python3
"""
RGB565 C Header to PNG Converter
Converts img_*.h RGB565 pixel data to PNG files in images/ directory.

Usage:
    python rgb565_to_png.py         -> convert all img_*.h
    python rgb565_to_png.py kiro    -> convert img_kiro.h -> images/img_kiro.png
"""

import glob
import os
import re
import sys

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


def convert(name, base_dir):
    """Convert a single img_<name>.h to images/img_<name>.png."""
    input_path = os.path.join(base_dir, f"img_{name}.h")
    if not os.path.exists(input_path):
        print(f"Error: File not found: {input_path}")
        return

    output_path = os.path.join(base_dir, "images", f"img_{name}.png")
    width, height, pixels = parse_header(input_path)
    img = Image.new("RGBA", (width, height))
    img.putdata([rgb565_to_rgba(p) for p in pixels])
    img.save(output_path)
    print(f"  img_{name}.h -> images/img_{name}.png ({width}x{height})")


def main():
    # Project root is one level up from tools/
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.makedirs(os.path.join(base_dir, "images"), exist_ok=True)

    if len(sys.argv) >= 2:
        names = sys.argv[1:]
    else:
        pattern = os.path.join(base_dir, "img_*.h")
        names = [
            os.path.basename(p)[4:-2]  # img_kiro.h -> kiro
            for p in sorted(glob.glob(pattern))
        ]

    if not names:
        print("No img_*.h files found.")
        return

    print(f"Converting {len(names)} file(s)...")
    for name in names:
        convert(name, base_dir)
    print("Done.")


if __name__ == "__main__":
    main()
