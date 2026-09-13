import sys
import os
os.makedirs("screenshots", exist_ok=True)
from playwright.sync_api import sync_playwright

PAGES = [
    ("home", "http://localhost:5173/"),
    ("vacancies", "http://localhost:5173/search/vacancy"),
    ("vacancy_detail", "http://localhost:5173/vacancy/demo-frontend-dasturchi-react"),
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    errors_found = False

    for name, url in PAGES:
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda exc: console_errors.append(str(exc)))

        page.goto(url)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1800)  # animatsiyalar tugashi uchun

        page.screenshot(path=f"screenshots/{name}.png", full_page=True)
        print(f"[{name}] OK -> screenshot saqlandi")

        if console_errors:
            errors_found = True
            print(f"[{name}] CONSOLE XATOLAR:")
            for e in console_errors:
                print("   ", e)

        page.close()

    # Mobile viewport uchun ham bosh sahifa
    mobile = browser.new_page(viewport={"width": 390, "height": 844})
    mobile.goto("http://localhost:5173/")
    mobile.wait_for_load_state("networkidle")
    mobile.wait_for_timeout(1800)
    mobile.screenshot(path="screenshots/home_mobile.png", full_page=True)
    print("[home_mobile] OK -> screenshot saqlandi")
    mobile.close()

    browser.close()

    if errors_found:
        sys.exit(1)
