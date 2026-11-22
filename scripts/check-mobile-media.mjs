import assert from "node:assert/strict";
import { chromium, webkit } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:4174/?phase=main";
for (const engine of [chromium, webkit]) {
    const browser = await engine.launch(engine === chromium ? { channel: "msedge" } : {});
    try {
        const page = await browser.newPage({ viewport: { width: 402, height: 800 }, isMobile: true, hasTouch: true });
        await page.addInitScript(() => {
            window.IntersectionObserver = class {
                observe() {}
                unobserve() {}
                disconnect() {}
                takeRecords() { return []; }
            };
        });
        await page.goto(url);
        const frame = page.frameLocator('iframe[title*="蛋糕"]');
        await frame.locator("body.ready").waitFor();
        const painted = () => frame.locator("#cake-canvas").evaluate(canvas =>
            canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data
                .some((value, i) => i % 4 === 3 && value > 0));
        assert.ok(await painted(), "The cake must draw even when visibility observers never fire");
        await frame.locator("#scene").evaluate(host => {
            host.style.width = "0px";
            window.dispatchEvent(new Event("resize"));
            host.style.width = "";
            window.dispatchEvent(new Event("resize"));
        });
        assert.ok(await painted(), "Resizing through zero width must preserve the cake");
        await page.getByRole("link", { name: "去许愿" }).click();
        await frame.locator("#wish").click();
        assert.match(await frame.locator("#wish").innerText(), /再点亮/);
        await page.getByRole("link", { name: "翻开相册" }).click();
        await page.locator(".memory-wall img").first().evaluate(image => image.decode());
        for (let i = 0; i < 3; i++) {
            await page.locator(".memory-album__group").nth(i).locator("button").first().click();
            await page.locator("dialog[open] img").evaluate(image => image.decode());
            await page.keyboard.press("Escape");
        }
        console.log(engine.name() + " passed: observer silence, zero width, candle and photos");
    } finally {
        await browser.close();
    }
}
