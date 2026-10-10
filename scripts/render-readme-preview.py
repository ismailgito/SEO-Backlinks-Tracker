#!/usr/bin/env python3
"""Render docs/readme-preview.html to docs/assets/backlinks-product-tour.gif.

Requirements: Python Playwright, Chromium, ffmpeg, and network access to cdnjs for GSAP 3.12.5.
"""
from __future__ import annotations

import math
import shutil
import subprocess
import tempfile
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "docs" / "readme-preview.html"
OUTPUT = ROOT / "docs" / "assets" / "backlinks-product-tour.gif"
GSAP_URL = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
FPS = 15


def main() -> None:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise SystemExit("ffmpeg is required to build the animated GIF")

    with urllib.request.urlopen(GSAP_URL, timeout=30) as response:
        gsap = response.read()

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="readme-preview-") as temp_dir:
        frame_dir = Path(temp_dir)
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                executable_path=shutil.which("chromium") or "/usr/bin/chromium",
                headless=True,
                args=["--no-sandbox"],
            )
            page = browser.new_page(viewport={"width": 960, "height": 540}, device_scale_factor=1)
            page.route(
                "**/gsap.min.js",
                lambda route: route.fulfill(status=200, content_type="application/javascript", body=gsap),
            )
            page.goto(HTML.as_uri(), wait_until="load", timeout=30_000)
            page.wait_for_function("window.__timelines?.length === 1 && window.renderAt", timeout=15_000)
            duration = float(page.locator("#clip").get_attribute("data-duration"))
            frame_count = math.ceil(duration * FPS)
            for index in range(frame_count + 1):
                time = min(index / FPS, duration)
                # Return a primitive: returning GSAP's timeline object can stall protocol serialization.
                page.evaluate("(time) => { window.renderAt(time); return true; }", time)
                page.screenshot(path=str(frame_dir / f"frame_{index:04d}.png"), timeout=15_000)
                if (index + 1) % 30 == 0 or index == frame_count:
                    print(f"Captured {index + 1}/{frame_count + 1} frames", flush=True)
            browser.close()

        # Use the exact opening raster for the final frame so the GIF loops without a one-pixel shimmer.
        shutil.copyfile(frame_dir / "frame_0000.png", frame_dir / f"frame_{frame_count:04d}.png")

        subprocess.run(
            [
                ffmpeg,
                "-hide_banner",
                "-loglevel",
                "error",
                "-y",
                "-framerate",
                str(FPS),
                "-i",
                str(frame_dir / "frame_%04d.png"),
                "-vf",
                "fps=15,scale=960:-1:flags=lanczos,split[s0][s1];"
                "[s0]palettegen=max_colors=128:stats_mode=diff[p];"
                "[s1][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle",
                "-loop",
                "0",
                str(OUTPUT),
            ],
            check=True,
        )
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
