from playwright.sync_api import sync_playwright
import os
os.makedirs("screenshots", exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:5173/search/vacancy")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(800)

    card = page.locator("a:has-text('Frontend dasturchi (React)')").first
    card.scroll_into_view_if_needed()

    page.screenshot(path="screenshots/card_before_hover.png", clip={"x": 380, "y": 220, "width": 360, "height": 160})

    card.hover()
    page.wait_for_timeout(400)  # transition tugashi uchun
    page.screenshot(path="screenshots/card_after_hover.png", clip={"x": 380, "y": 200, "width": 360, "height": 180})

    print("Hover skrinshotlar saqlandi")
    browser.close()
