#!/usr/bin/env python3
"""
Jobnity Report Figures Capture Script
Captures high-resolution (Retina 2x) screenshots of all key Jobnity application pages
and converts each into high-contrast grayscale/black-and-white for academic report / thesis.
"""

import os
import sys
import time
from pathlib import Path
from PIL import Image, ImageEnhance
from playwright.sync_api import sync_playwright

OUTPUT_DIR = Path("/home/adityap/ai/Projects/Jobnity/report_figures")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

BASE_URL = "http://localhost:5173"

def make_academic_bw(color_path: Path, bw_path: Path):
    """
    Generate an elegant high-contrast grayscale version for thesis/academic publication.
    """
    img = Image.open(color_path)
    gray = img.convert("L")
    enhancer = ImageEnhance.Contrast(gray)
    enhanced = enhancer.enhance(1.18)
    enhanced.save(bw_path, "PNG", optimize=True)
    print(f"  [BW] Created: {bw_path.name} ({bw_path.stat().st_size // 1024} KB)")

def capture_all():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # 1600x1000 viewport with device_scale_factor=2 -> 3200x2000 retina output
        context = browser.new_context(
            viewport={"width": 1600, "height": 1000},
            device_scale_factor=2,
            has_touch=False
        )
        page = context.new_page()

        print("=== 1. Capturing Figure 4.5: Landing Page ===")
        page.goto(f"{BASE_URL}/", wait_until="networkidle")
        page.wait_for_timeout(2000)
        c_path = OUTPUT_DIR / "Figure_4_5_Landing_Page.png"
        bw_path = OUTPUT_DIR / "Figure_4_5_Landing_Page_BW.png"
        page.screenshot(path=str(c_path))
        print(f"  [Color] Saved: {c_path.name}")
        make_academic_bw(c_path, bw_path)

        print("\n=== 2. Capturing Figure 4.6: Resume Upload Step ===")
        page.goto(f"{BASE_URL}/analyse-resume", wait_until="networkidle")
        page.wait_for_selector(".upload-panel", timeout=10000)
        page.wait_for_timeout(2000)
        c_path = OUTPUT_DIR / "Figure_4_6_Resume_Upload_Step.png"
        bw_path = OUTPUT_DIR / "Figure_4_6_Resume_Upload_Step_BW.png"
        page.screenshot(path=str(c_path))
        print(f"  [Color] Saved: {c_path.name}")
        make_academic_bw(c_path, bw_path)

        print("\n=== 3. Capturing Figure 4.7: Resume Review Step ===")
        sample_btn = page.locator("button.sample-btn", has_text="Software Engineer").first
        sample_btn.click()
        page.wait_for_selector(".resume-panel--review", timeout=20000)
        page.wait_for_timeout(2500)
        c_path = OUTPUT_DIR / "Figure_4_7_Resume_Review_Step.png"
        bw_path = OUTPUT_DIR / "Figure_4_7_Resume_Review_Step_BW.png"
        page.screenshot(path=str(c_path))
        print(f"  [Color] Saved: {c_path.name}")
        make_academic_bw(c_path, bw_path)

        print("\n=== 4. Capturing Figure 4.8: Role Selection Step ===")
        save_btn = page.locator(".confirm-profile-btn").first
        save_btn.click()
        page.wait_for_selector(".role-selection-panel", timeout=15000)
        
        # Wait for AI recommendations or role card to be ready
        try:
            page.wait_for_selector(".confirm-role-btn", timeout=15000)
        except Exception:
            # If not auto-selected, click first available role card or dropdown
            first_card = page.locator(".eligible-role-card").first
            if first_card.is_visible():
                first_card.click()
            page.wait_for_selector(".confirm-role-btn", timeout=5000)

        page.wait_for_timeout(2500)
        c_path = OUTPUT_DIR / "Figure_4_8_Role_Selection_Step.png"
        bw_path = OUTPUT_DIR / "Figure_4_8_Role_Selection_Step_BW.png"
        page.screenshot(path=str(c_path))
        print(f"  [Color] Saved: {c_path.name}")
        make_academic_bw(c_path, bw_path)

        print("\n=== 5. Capturing Figure 4.9: Skill Gap Analysis Step ===")
        analyse_btn = page.locator(".confirm-role-btn").first
        analyse_btn.click()
        page.wait_for_selector(".analysis-results-container", timeout=20000)
        page.wait_for_timeout(3500)
        c_path = OUTPUT_DIR / "Figure_4_9_Skill_Gap_Analysis.png"
        bw_path = OUTPUT_DIR / "Figure_4_9_Skill_Gap_Analysis_BW.png"
        page.screenshot(path=str(c_path))
        print(f"  [Color] Saved: {c_path.name}")
        make_academic_bw(c_path, bw_path)

        print("\n=== 6. Capturing Figure 4.10: Roadmaps Page ===")
        page.goto(f"{BASE_URL}/roadmaps", wait_until="networkidle")
        page.wait_for_selector(".roadmap-explorer-container", timeout=10000)
        page.wait_for_timeout(2500)
        c_path = OUTPUT_DIR / "Figure_4_10_Roadmaps_Page.png"
        bw_path = OUTPUT_DIR / "Figure_4_10_Roadmaps_Page_BW.png"
        page.screenshot(path=str(c_path))
        print(f"  [Color] Saved: {c_path.name}")
        make_academic_bw(c_path, bw_path)

        print("\n=== 7. Capturing Figure 4.11: Mock Interview Page ===")
        page.goto(f"{BASE_URL}/interview", wait_until="networkidle")
        # Give Qwen interview question generator time to populate the question
        page.wait_for_timeout(6000)
        c_path = OUTPUT_DIR / "Figure_4_11_Mock_Interview_Page.png"
        bw_path = OUTPUT_DIR / "Figure_4_11_Mock_Interview_Page_BW.png"
        page.screenshot(path=str(c_path))
        print(f"  [Color] Saved: {c_path.name}")
        make_academic_bw(c_path, bw_path)

        print("\n=== 8. Capturing Figure 4.12: Documentation Page ===")
        page.goto(f"{BASE_URL}/docs", wait_until="networkidle")
        page.wait_for_selector(".docs-hero-card", timeout=10000)
        page.wait_for_timeout(2500)
        c_path = OUTPUT_DIR / "Figure_4_12_Documentation_Page.png"
        bw_path = OUTPUT_DIR / "Figure_4_12_Documentation_Page_BW.png"
        page.screenshot(path=str(c_path))
        print(f"  [Color] Saved: {c_path.name}")
        make_academic_bw(c_path, bw_path)

        browser.close()
        print("\nAll figures successfully captured and converted!")

if __name__ == "__main__":
    capture_all()
