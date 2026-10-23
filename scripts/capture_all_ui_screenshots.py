import asyncio
import json
import os
import time
import base64
import urllib.request
import subprocess
import websockets
from PIL import Image, ImageEnhance

OUTPUT_DIR = "/home/adityap/ai/Projects/Jobnity/report_figures"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def save_dual_images(raw_png_bytes, base_name):
    color_path = os.path.join(OUTPUT_DIR, f"{base_name}.png")
    bw_path = os.path.join(OUTPUT_DIR, f"{base_name}_BW.png")
    
    with open(color_path, "wb") as f:
        f.write(raw_png_bytes)
        
    img = Image.open(color_path)
    bw = img.convert("L")
    # Enhance contrast slightly for laser printer crispness
    enhancer = ImageEnhance.Contrast(bw)
    bw_enhanced = enhancer.enhance(1.18)
    sharpener = ImageEnhance.Sharpness(bw_enhanced)
    bw_final = sharpener.enhance(1.12)
    bw_final.save(bw_path, "PNG", optimize=True)
    
    print(f" Saved: {base_name}.png ({os.path.getsize(color_path)//1024} KB) and {base_name}_BW.png ({os.path.getsize(bw_path)//1024} KB)")

async def capture_screenshots():
    chrome_port = 9335
    proc = subprocess.Popen([
        "/usr/bin/google-chrome",
        "--headless=new",
        f"--remote-debugging-port={chrome_port}",
        "--user-data-dir=/tmp/chrome_report_capture_profile",
        "--disable-gpu",
        "--no-sandbox",
        "--window-size=1600,1050"
    ])
    await asyncio.sleep(2)
    
    try:
        targets_raw = urllib.request.urlopen(f"http://127.0.0.1:{chrome_port}/json").read()
        targets = json.loads(targets_raw)
        page_target = next(t for t in targets if t.get("type") == "page")
        ws_url = page_target["webSocketDebuggerUrl"]
        
        async with websockets.connect(ws_url, max_size=50*1024*1024) as ws:
            msg_id = 1
            
            async def send(method, params=None):
                nonlocal msg_id
                cid = msg_id
                msg_id += 1
                await ws.send(json.dumps({"id": cid, "method": method, "params": params or {}}))
                while True:
                    resp = json.loads(await ws.recv())
                    if resp.get("id") == cid:
                        return resp.get("result", {})
            
            async def evaluate_js(expression):
                res = await send("Runtime.evaluate", {
                    "expression": expression,
                    "returnByValue": True,
                    "awaitPromise": True
                })
                return res.get("result", {}).get("value")

            async def wait_for_selector(selector, timeout=10):
                start = time.time()
                while time.time() - start < timeout:
                    found = await evaluate_js(f"Boolean(document.querySelector('{selector}'))")
                    if found:
                        return True
                    await asyncio.sleep(0.3)
                return False

            await send("Page.enable")
            await send("Runtime.enable")
            await send("DOM.enable")
            
            # 1600x1000 viewport, 2x retina scale for crystal-clear publication images
            await send("Emulation.setDeviceMetricsOverride", {
                "width": 1600,
                "height": 1000,
                "deviceScaleFactor": 2,
                "mobile": False
            })

            # -------------------------------------------------------------
            # 1. Figure 4.2: Landing Page
            # -------------------------------------------------------------
            print("\n[1/8] Capturing Landing Page...")
            await send("Page.navigate", {"url": "http://localhost:5173/"})
            await wait_for_selector(".hero-title, h1", timeout=8)
            await asyncio.sleep(1.5)
            # Remove any transient cursor or tooltip
            res = await send("Page.captureScreenshot", {"format": "png"})
            save_dual_images(base64.b64decode(res["data"]), "Figure_4_2_Landing_Page")

            # -------------------------------------------------------------
            # 2. Figure 4.3: Step 1 - Resume Upload
            # -------------------------------------------------------------
            print("\n[2/8] Capturing Step 1: Resume Upload...")
            await send("Page.navigate", {"url": "http://localhost:5173/analyse-resume"})
            await wait_for_selector(".upload-panel, .drop-zone", timeout=8)
            await asyncio.sleep(1.0)
            res = await send("Page.captureScreenshot", {"format": "png"})
            save_dual_images(base64.b64decode(res["data"]), "Figure_4_3_Resume_Upload_Step")

            # -------------------------------------------------------------
            # 3. Figure 4.4: Step 2 - Extracted Profile Review
            # -------------------------------------------------------------
            print("\n[3/8] Loading sample profile and capturing Step 2: Extracted Profile Review...")
            # Click the 'Software Engineer' sample button
            await evaluate_js("""
                const btn = Array.from(document.querySelectorAll('.sample-btn')).find(b => b.textContent.includes('Software Engineer'));
                if (btn) btn.click();
            """)
            await wait_for_selector(".review-panel, .confirm-profile-btn", timeout=12)
            await asyncio.sleep(1.5)
            # Scroll down just slightly to balance header and content
            await evaluate_js("window.scrollTo(0, 120);")
            await asyncio.sleep(0.5)
            res = await send("Page.captureScreenshot", {"format": "png"})
            save_dual_images(base64.b64decode(res["data"]), "Figure_4_4_Extracted_Profile_Review")

            # -------------------------------------------------------------
            # 4. Figure 4.5: Step 3 - Role Selection
            # -------------------------------------------------------------
            print("\n[4/8] Confirming profile and capturing Step 3: Role Selection...")
            await evaluate_js("window.scrollTo(0, document.body.scrollHeight);")
            await asyncio.sleep(0.5)
            await evaluate_js("""
                const btn = document.querySelector('.confirm-profile-btn');
                if (btn) btn.click();
            """)
            await wait_for_selector(".role-selection-panel, .role-card, .confirm-role-btn", timeout=12)
            await asyncio.sleep(1.5)
            await evaluate_js("window.scrollTo(0, 0);")
            await asyncio.sleep(0.5)
            res = await send("Page.captureScreenshot", {"format": "png"})
            save_dual_images(base64.b64decode(res["data"]), "Figure_4_5_Role_Selection_Step")

            # -------------------------------------------------------------
            # 5. Figure 4.6: Step 4 - Skill Gap Analysis & Readiness
            # -------------------------------------------------------------
            print("\n[5/8] Running analysis and capturing Step 4: Skill Gap Analysis...")
            await evaluate_js("""
                // Ensure a role is selected and click confirm-role-btn
                const roleCards = Array.from(document.querySelectorAll('.role-card'));
                const targetCard = roleCards.find(c => c.textContent.includes('Full Stack') || c.textContent.includes('Software Engineer')) || roleCards[0];
                if (targetCard) targetCard.click();
                setTimeout(() => {
                    const btn = document.querySelector('.confirm-role-btn');
                    if (btn) btn.click();
                }, 300);
            """)
            await wait_for_selector(".analysis-results-container, .readiness-gauge-wrapper", timeout=15)
            await asyncio.sleep(2.0)
            await evaluate_js("window.scrollTo(0, 60);")
            await asyncio.sleep(0.5)
            res = await send("Page.captureScreenshot", {"format": "png"})
            save_dual_images(base64.b64decode(res["data"]), "Figure_4_6_Skill_Gap_Analysis_Report")

            # -------------------------------------------------------------
            # 6. Figure 4.7: Roadmaps Page
            # -------------------------------------------------------------
            print("\n[6/8] Capturing Career Learning Roadmaps...")
            await send("Page.navigate", {"url": "http://localhost:5173/roadmaps"})
            await wait_for_selector(".roadmap-explorer-container, .role-card, h1", timeout=10)
            await asyncio.sleep(1.5)
            res = await send("Page.captureScreenshot", {"format": "png"})
            save_dual_images(base64.b64decode(res["data"]), "Figure_4_7_Interactive_Learning_Roadmaps")

            # -------------------------------------------------------------
            # 7. Figure 4.8: AI Mock Interview Page
            # -------------------------------------------------------------
            print("\n[7/8] Capturing AI Mock Interview Terminal...")
            await send("Page.navigate", {"url": "http://localhost:5173/interview"})
            await wait_for_selector(".interview-setup, .terminal-window, h1", timeout=10)
            await asyncio.sleep(1.5)
            res = await send("Page.captureScreenshot", {"format": "png"})
            save_dual_images(base64.b64decode(res["data"]), "Figure_4_8_AI_Mock_Interview_Terminal")

            # -------------------------------------------------------------
            # 8. Figure 4.9: Platform & API Documentation
            # -------------------------------------------------------------
            print("\n[8/8] Capturing Documentation Page...")
            await send("Page.navigate", {"url": "http://localhost:5173/docs"})
            await wait_for_selector(".docs-container, .docs-sidebar, h1", timeout=10)
            await asyncio.sleep(1.5)
            res = await send("Page.captureScreenshot", {"format": "png"})
            save_dual_images(base64.b64decode(res["data"]), "Figure_4_9_System_Documentation")

            print("\n All 8 figures successfully captured in Color and B&W!")

    finally:
        proc.terminate()

if __name__ == "__main__":
    asyncio.run(capture_screenshots())
