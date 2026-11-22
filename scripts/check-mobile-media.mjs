import assert from "node:assert/strict";
import { chromium, webkit } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:4174/?phase=main";
for (const engine of [chromium, webkit]) {
    const browser = await engine.launch(engine === chromium ? { channel: "msedge" } : {});
    try {
        const page = await browser.newPage({ viewport: { width: 402, height: 800 }, isMobile: true, hasTouch: true });
        page.setDefaultTimeout(20000);
        const photoRequests = new Set();
        page.on("request", request => {
            if (request.url().includes("/memories/")) photoRequests.add(request.url());
        });
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
        await page.getByRole("link", { name: "去许愿" }).click();
        await frame.locator("body.ready").waitFor();
        await page.locator(".memory-album__grid").first().waitFor();
        assert.equal(await page.locator(".memory-album__grid img").last().getAttribute("src"), null,
            "Offscreen photos must not download before scrolling, even without native lazy loading");
        assert.ok(photoRequests.size < 40, "The initial page must not request the entire album");
        console.log(engine.name() + " initial unique photo requests: " + photoRequests.size);
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
        await frame.locator("#cake-canvas").evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        assert.ok(await painted(), "Resizing through zero width must preserve the cake");
        await frame.locator("#wish").click();
        assert.match(await frame.locator("#wish").innerText(), /再点亮/);
        await page.getByRole("link", { name: "翻开相册" }).click();
        await page.waitForFunction(() => [...document.querySelectorAll(".memory-wall img")].some(image => image.complete && image.naturalWidth > 0));
        for (let i = 0; i < 3; i++) {
            await page.locator(".memory-album__group").nth(i).locator("button").first().click();
            await page.locator("dialog[open] img").evaluate(image => image.decode());
            await page.keyboard.press("Escape");
        }
        const lastPhoto = page.locator(".memory-album__grid img").last();
        await lastPhoto.scrollIntoViewIfNeeded();
        await lastPhoto.evaluate(image => new Promise((resolve, reject) => {
            if (image.complete && image.naturalWidth) return resolve();
            image.onload = resolve;
            image.onerror = reject;
        }));
        console.log(engine.name() + " passed: observer silence, zero width, candle and photos");
        await page.close();
        const phone = await browser.newPage({
            viewport: { width: 402, height: 800 }, isMobile: true, hasTouch: true,
            userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 27_2 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 MicroMessenger/8.0.80",
            reducedMotion: "no-preference",
        });
        phone.setDefaultTimeout(20000);
        await phone.addInitScript(() => {
            window.webglAttempts = 0;
            const original = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function (type, ...args) {
                if (type.startsWith("webgl")) window.webglAttempts++;
                return original.call(this, type, ...args);
            };
        });
        if (engine === chromium) {
            const cdp = await phone.context().newCDPSession(phone);
            await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
        }
        await phone.goto(url);
        const compatible = phone.frameLocator('iframe[title*="蛋糕"]');
        await phone.getByRole("link", { name: "去许愿" }).click();
        await compatible.locator("body.ready").waitFor();
        assert.equal(await compatible.locator("body").evaluate(() => window.webglAttempts), 0,
            "iPhone must not create the potentially hanging WebGL context");
        assert.match(await compatible.locator("#cake-canvas").getAttribute("data-renderer"), /Canvas fallback/);
        const canvas = compatible.locator("#cake-canvas");
        const yaw = await canvas.getAttribute("data-yaw");
        const box = await canvas.boundingBox();
        await phone.mouse.move(box.x + box.width * .4, box.y + box.height * .5);
        await phone.mouse.down();
        await phone.mouse.move(box.x + box.width * .6, box.y + box.height * .5);
        await phone.mouse.up();
        assert.notEqual(await canvas.getAttribute("data-yaw"), yaw);
        await canvas.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const litPixels = await canvas.evaluate(element => element.toDataURL());
        await compatible.locator("#wish").click();
        assert.match(await compatible.locator("#wish").innerText(), /再点亮/);
        await canvas.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        assert.notEqual(await canvas.evaluate(element => element.toDataURL()), litPixels,
            "Blowing out the candle must repaint the software canvas");
        console.log(engine.name() + " passed: iPhone Canvas mode, no WebGL, rotation and candle");
        await phone.close();
        if (engine === webkit) {
            const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: "no-preference" });
            desktop.setDefaultTimeout(20000);
            const errors = [];
            desktop.on("pageerror", error => errors.push(error.message));
            const entry = new URL(url);
            entry.searchParams.delete("phase");
            await desktop.goto(entry.href);
            await desktop.getByRole("button", { name: "点一下，打开惊喜" }).click();
            console.log("webkit desktop: natural intro started");
            await desktop.getByRole("link", { name: "去许愿" }).waitFor({ timeout: 180000 });
            console.log("webkit desktop: natural intro completed");
            await desktop.getByRole("link", { name: "去许愿" }).click();
            const cake = desktop.frameLocator('iframe[title*="蛋糕"]');
            await cake.locator("body.ready").waitFor();
            assert.match(await cake.locator("#cake-canvas").getAttribute("data-renderer"), /WebGL/);
            await cake.locator("#wish").click();
            assert.match(await cake.locator("#wish").innerText(), /再点亮/);
            for (let repeat = 0; repeat < 3; repeat++) {
                for (let group = 0; group < 3; group++) {
                    await desktop.locator(".memory-album__group").nth(group).locator("button").first().click();
                    await desktop.locator("dialog[open] img").evaluate(image => image.decode());
                    await desktop.keyboard.press("Escape");
                }
            }
            await desktop.locator("#cake-section").scrollIntoViewIfNeeded();
            await cake.locator("#wish").click();
            assert.match(await cake.locator("#wish").innerText(), /许愿后/);
            assert.deepEqual(errors, []);
            console.log("webkit desktop passed: full intro, WebGL cake, repeated albums and return");
            await desktop.close();
        }
    } finally {
        await browser.close();
    }
}
