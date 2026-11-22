import { chromium } from "playwright";
import { readFile, writeFile } from "node:fs/promises";

const sourcePath = new URL("../public/cake/birthday-cake-demo.html", import.meta.url);
let source = (await readFile(sourcePath, "utf8")).replace(/\r\n/g, "\n");
const browser = await chromium.launch({ channel: "msedge" });
let assets;
try {
    const page = await browser.newPage({
        viewport: { width: 480, height: 700 },
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 27_2 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
    });
    await page.addInitScript(() => {
        let Scene;
        Object.defineProperty(window, "GalaxyCakeScene", {
            get() { return Scene; },
            set(Type) {
                Scene = class extends Type {
                    constructor(...args) { super(...args); window.exportCake = this; }
                };
            },
        });
    });
    await page.goto(sourcePath.href);
    await page.locator("body.ready").waitFor({ timeout: 15000 });
    assets = await page.evaluate(() => {
        const cake = window.exportCake;
        cake.visible = false;
        cake.updateLoop();
        return {
            body: cake.scene.getObjectByName("solid-cake-cylinder").material.map.image.toDataURL("image/webp", .82),
            background: cake.renderer.background.toDataURL("image/webp", .76),
        };
    });
} finally {
    await browser.close();
}

source = source.replace(/<script>\s*\/\/ Depth-tested triangles[\s\S]*?<\/script>/, "");
source = source.replace(/<script>\s*\/\* Glow composition[\s\S]*?<\/script>/, "");
const textureStart = source.indexOf("  function galaxyTexture() {");
const textureEnd = source.indexOf("  function creamTexture() {", textureStart);
if (textureStart < 0 || textureEnd < 0) throw new Error("Original cake texture block was not found");
source = source.slice(0, textureStart) + `  function galaxyTexture() {
    // Preserve the original seeded decoration positions after baking its pixels.
    for(let i=0;i<65*4+2800*6+28*6;i++)random();
    const tex=texture(document.getElementById('cake-body-map'));tex.wrapS=T.RepeatWrapping;return tex;
  }
` + source.slice(textureEnd);
source = source.replace(/      const ios=[\s\S]*?root\.cakeReport\(this\.renderer\.software\?'使用软件渲染器':'WebGL 渲染器已创建'\);/, `      this.renderer=new T.WebGLRenderer({alpha:true,antialias:false,preserveDrawingBuffer:false,powerPreference:'low-power'});
      root.cakeReport('原生 Three.js WebGL 渲染器已创建');`);
source = source.replace("      this.renderer=new root.DreamCakeRenderer(this.renderer);\n", "");
source = source.replace("this.canvas.dataset.renderer=this.renderer.software?'Three.js geometry · Canvas fallback':'Three.js WebGL';", "this.canvas.dataset.renderer='Three.js WebGL · native';");
source = source.replace("</style></head>", `#scene{background:url("${assets.background}") center/cover}</style></head>`);
source = source.replace('<main id="scene"></main>', `<main id="scene"></main><img id="cake-body-map" src="${assets.body}" alt="" hidden>`);
source = source.replace("function requestCakeBoot(){if(bootStarted)return;bootStarted=true;setTimeout(bootCake,0);}", "function requestCakeBoot(){if(bootStarted)return;bootStarted=true;document.getElementById('cake-body-map').decode().then(()=>setTimeout(bootCake,0)).catch(error=>{document.getElementById('error').style.display='block';document.getElementById('error').textContent='蛋糕纹理未能解码，请重新打开。';window.cakeReport(String(error));});}");
source = source.replace("cake.flame.visible = cake.flameGlow.visible = cake.candleLight.visible = lit;", "cake.flame.traverse(object=>{object.visible=lit;});cake.flameGlow.visible=lit;cake.candleLight.visible=true;cake.candleLight.intensity=lit?5.1:0;");
source = source.replace("cake.dirty = true;\n    cake.updateLoop();", "cake.dirty = true;\n    cake.draw();\n    requestAnimationFrame(()=>cake.renderer.render(cake.scene,cake.camera));");
source = source.replace("this.candleLight.intensity=5.1+(flicker-1)*10;", "this.candleLight.intensity=this.flame.visible?5.1+(flicker-1)*10:0;");
source = source.replace("const p=[],idx=[],steps=64,sides=18;", "const mobile=matchMedia('(pointer:coarse)').matches;const p=[],idx=[],steps=mobile?28:48,sides=mobile?12:16;");
source = source.replace("for(let pass=0;pass<3;pass++){", "for(let pass=0;pass<1;pass++){");
source = source.replace("new T.TubeGeometry(curve,220,width,6,true)", "new T.TubeGeometry(curve,96,width,4,true)");
source = source.replace("new T.SphereGeometry(1,8,6)", "new T.OctahedronGeometry(1,0)");
source = source.replace("return new T.TubeGeometry(new T.CatmullRomCurve3(path),segments,radius,8,false);", "const mobile=matchMedia('(pointer:coarse)').matches;return new T.TubeGeometry(new T.CatmullRomCurve3(path),mobile?Math.min(segments,96):segments,radius,mobile?6:8,false);");
source = source.replace("new T.SphereGeometry(size,10,8)", "new T.SphereGeometry(size,8,6)");
source = source.replace("new T.CylinderGeometry(1.54,1.56,2.38,144,8)", "new T.CylinderGeometry(1.54,1.56,2.38,144,1)");
const materialStart = source.indexOf("  class GalaxyCakeScene {");
if (materialStart < 0) throw new Error("Original cake scene class was not found");
const materialCode = source.slice(materialStart).replaceAll("new T.MeshPhysicalMaterial", "new T.MeshStandardMaterial")
    .replace(/,clearcoatRoughness:[^,}]+/g, "").replace(/,clearcoat:[^,}]+/g, "");
source = source.slice(0, materialStart) + materialCode;
const cloudsStart = source.indexOf("      for(let i=0;i<22;i++){", source.indexOf("    makeParticles() {"));
const cloudsEnd = source.indexOf("    }\n    bindPointer() {", cloudsStart);
if (cloudsStart < 0 || cloudsEnd < 0) throw new Error("Original floating glow layers were not found");
source = source.slice(0, cloudsStart) + source.slice(cloudsEnd);
const loopStart = source.indexOf("    updateLoop() {");
const loopEnd = source.indexOf("    draw() {", loopStart);
if (loopStart < 0 || loopEnd < loopStart) throw new Error("Original cake render loop was not found");
source = source.slice(0, loopStart) + `    updateLoop() {
      if(document.hidden || !this.visible){cancelAnimationFrame(this.raf);clearTimeout(this.timer);this.raf=null;this.timer=null;return;}
      if(this.dirty){
        clearTimeout(this.timer);this.timer=null;
        if(this.raf==null)this.raf=requestAnimationFrame(()=>this.draw());
      }else if(!this.motion?.matches && this.raf==null && this.timer==null){
        this.timer=setTimeout(()=>{this.timer=null;this.raf=requestAnimationFrame(()=>this.draw());},1000/15);
      }
    }
` + source.slice(loopEnd);
if (source.includes("new root.DreamCakeRenderer") || source.includes("class SoftwareCakeRenderer") || source.includes("const ios=")) {
    throw new Error("Native output still includes the software rendering path");
}
const target = new URL("../public/cake/native-cake.html", import.meta.url);
await writeFile(target, source);
console.log("Native Three.js cake generated:", source.length, "characters");
