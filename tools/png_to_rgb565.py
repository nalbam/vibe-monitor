#!/usr/bin/env python3
"""
PNG to RGB565 C Array Converter for ESP32
Converts images/img_*.png to RGB565 format C header files.

Usage:
    python png_to_rgb565.py         -> convert all images/img_*.png
    python png_to_rgb565.py kiro    -> convert images/img_kiro.png -> img_kiro.h
"""

import glob
import os
import sys

from PIL import Image

TRANSPARENT_COLOR = 0xF81F  # Magenta as transparent marker


def rgb_to_rgb565(r, g, b):
    """Convert RGB888 to RGB565."""
    return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3)


def build_header(input_path, name, target_size=128):
    """Convert PNG image to RGB565 C array string."""
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size

    if width != target_size or height != target_size:
        print(f"Resizing from {width}x{height} to {target_size}x{target_size}...")
        img = img.resize((target_size, target_size), Image.Resampling.LANCZOS)
        width, height = target_size, target_size

    lines = []
    lines.append(f"// {name.upper()} character image ({width}x{height})")
    lines.append(f"// Generated from {os.path.basename(input_path)}")
    lines.append(f"#define IMG_{name.upper()}_WIDTH {width}")
    lines.append(f"#define IMG_{name.upper()}_HEIGHT {height}")
    lines.append("")
    lines.append(f"const uint16_t IMG_{name.upper()}[{width * height}] PROGMEM = {{")

    for y in range(height):
        row_values = []
        for x in range(width):
            r, g, b, a = img.getpixel((x, y))
            rgb565 = TRANSPARENT_COLOR if a < 128 else rgb_to_rgb565(r, g, b)
            row_values.append(f"0x{rgb565:04X}")
        lines.append("  " + ", ".join(row_values) + ",")

    lines.append("};")
    lines.append("")

    return "\n".join(lines)


def convert(name, base_dir):
    """Convert images/img_<name>.png to img_<name>.h."""
    input_path = os.path.join(base_dir, "images", f"img_{name}.png")
    if not os.path.exists(input_path):
        print(f"Error: File not found: {input_path}")
        return

    output_path = os.path.join(base_dir, f"img_{name}.h")
    with open(output_path, "w") as f:
        f.write(build_header(input_path, name))
    print(f"  images/img_{name}.png -> img_{name}.h")


def main():
    # Project root is one level up from tools/
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    if len(sys.argv) >= 2:
        names = sys.argv[1:]
    else:
        pattern = os.path.join(base_dir, "images", "img_*.png")
        names = [
            os.path.basename(p)[4:-4]  # img_kiro.png -> kiro
            for p in sorted(glob.glob(pattern))
        ]

    if not names:
        print("No images/img_*.png files found.")
        return

    print(f"Converting {len(names)} file(s)...")
    for name in names:
        convert(name, base_dir)
    print("Done.")


if __name__ == "__main__":
    main()
