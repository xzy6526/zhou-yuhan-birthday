import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge" });
const mac = process.argv[3] === "mac";
try {
    const page = await browser.newPage({
        viewport: mac ? { width: 1440, height: 900 } : { width: 402, height: 800 }, isMobile: !mac, hasTouch: !mac,
        userAgent: mac ? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/26.6 Safari/605.1.15" : "Mozilla/5.0 (iPhone; CPU iPhone OS 27_2 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 MicroMessenger/8.0.80",
    });
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(20000);
    await page.addInitScript(() => {
        let Scene;
        Object.defineProperty(window, "GalaxyCakeScene", {
            get() { return Scene; },
            set(Type) { Scene = class extends Type { constructor(...args) { super(...args); window.testCake = this; } }; },
        });
    });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
    await page.goto(process.argv[2] || "http://127.0.0.1:4174/?phase=main", { waitUntil: "domcontentloaded" });
    console.log((mac ? "Mac" : "iPhone") + " page loaded");
    const frame = page.frameLocator('iframe[title*="蛋糕"]');
    await page.getByRole("link", { name: "去许愿" }).click();
    console.log("cake requested");
    await frame.locator("body.ready").waitFor();
    console.log("cake ready");
    await frame.locator("body").evaluate(() => {
        window.cakeProfile = {};
        for (const [name, method] of [["GalaxyCakeScene", "draw"], ["Starlight", "paint"]]) {
            const original = window[name].prototype[method], key = name + "." + method;
            window.cakeProfile[key] = [];
            window[name].prototype[method] = function (...args) {
                const start = performance.now();
                try { return original.apply(this, args); }
                finally { window.cakeProfile[key].push(performance.now() - start); }
            };
        }
        for (const method of ["render", "setSize"]) {
            const renderer = window.testCake.renderer, original = renderer[method], key = "WebGL." + method;
            window.cakeProfile[key] = [];
            renderer[method] = function (...args) {
                const start = performance.now();
                try { return original.apply(this, args); }
                finally { window.cakeProfile[key].push(performance.now() - start); }
            };
        }
    });
    await page.waitForTimeout(3000);
    const idle = await frame.locator("body").evaluate(() => Object.fromEntries(
        Object.entries(window.cakeProfile).map(([key, values]) => [key, {
            count: values.length, totalMs: Math.round(values.reduce((a, b) => a + b, 0)),
            maxMs: Math.round(Math.max(0, ...values)),
        }]),
    ));
    const resize = await frame.locator("body").evaluate(() => {
        const start = performance.now();
        for (let i = 0; i < 6; i++) window.dispatchEvent(new Event("resize"));
        return { durationMs: Math.round(performance.now() - start), rebuilds: window.cakeProfile["WebGL.setSize"].length };
    });
    console.log(JSON.stringify({ idle, resize }, null, 2));
    assert.ok(resize.rebuilds === 0, "Unchanged resize events must not rebuild WebGL buffers");
    assert.ok(idle["GalaxyCakeScene.draw"].count <= 65, "Idle light effects must stay inside their budget");
    assert.equal(idle["WebGL.render"].count, 0, "The real WebGL model must remain cached while idle");
} finally {
    await browser.close();
}
