import assert from "node:assert/strict";
import { chromium, webkit } from "playwright";
import { pathToFileURL } from "node:url";

for (const engine of [chromium, webkit]) {
    const browser = await engine.launch(engine === chromium ? { channel: "msedge" } : {});
    try {
        const page = await browser.newPage({ viewport: { width: 402, height: 800 }, isMobile: true, hasTouch: true });
        page.setDefaultTimeout(20000);
        await page.addInitScript(() => {
            let Scene;
            Object.defineProperty(window, "GalaxyCakeScene", {
                get() { return Scene; },
                set(Type) { Scene = class extends Type { constructor(...args) { super(...args); window.testCake = this; } }; },
            });
        });
        await page.goto(process.argv[2] || pathToFileURL(process.cwd() + "/public/cake/native-cake.html").href);
        await page.locator("body.ready").waitFor();
        const budget = await page.evaluate(() => ({
            calls: window.testCake.renderer.info.render.calls,
            triangles: window.testCake.renderer.info.render.triangles,
        }));
        console.log(engine.name(), budget);
        assert.ok(budget.calls < 50, "The phone cake must avoid hundreds of transparent draw calls");
        assert.ok(budget.triangles < 60000, "The phone mesh must stay inside its triangle budget");
        await page.locator("#wish").click();
        const off = await page.evaluate(() => ({
            lit: window.testCake.flame.visible,
            triangles: window.testCake.renderer.info.render.triangles,
        }));
        assert.equal(off.lit, false);
        assert.ok(off.triangles < budget.triangles, "Blowing the candle must change the real WebGL draw list");
        await page.mouse.move(150, 400);
        await page.mouse.down();
        const frames = await page.evaluate(() => {
            const start = window.testCake.renderer.info.render.frame;
            let i = 0;
            return new Promise(resolve => {
                const timer = setInterval(() => {
                    document.getElementById("cake-canvas").dispatchEvent(new PointerEvent("pointermove", { pointerType: "mouse", clientX: 150 + i, clientY: 400, bubbles: true }));
                    if (++i === 60) { clearInterval(timer); resolve(window.testCake.renderer.info.render.frame - start); }
                }, 8);
            });
        });
        await page.mouse.up();
        assert.ok(frames > 3, "Dragging must render while the pointer is still moving");
        console.log(engine.name(), "rendered during drag:", frames);
    } finally { await browser.close(); }
}
