import { ArrowDown, ArrowUpRight, BookOpen, CakeSlice, Flower2 } from "lucide-react";
import type { BirthdayConfig } from "@/features/core/store/useBirthdayStore";
import "./BirthdayCover.css";

// Stable positions keep the stardust still when the birthday stamp updates.
const stardust = Array.from({ length: 64 }, (_, i) => ({
    x: 12 + (i * 113 % 455),
    y: 12 + (i * 79 % 357),
    radius: .65 + (i % 4) * .35,
}));

function MoonDial() {
    return (
        <svg className="cover-sky" viewBox="0 0 480 395" aria-hidden="true" focusable="false">
            <defs>
                <radialGradient id="bloom-halo">
                    <stop stopColor="#f7b4cd" stopOpacity=".35" />
                    <stop offset=".57" stopColor="#cb81d7" stopOpacity=".18" />
                    <stop offset="1" stopColor="#ac7fe5" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="bloom-gold" x2=".84" y2="1">
                    <stop stopColor="#fff6ce" /><stop offset=".49" stopColor="#f6cc98" />
                    <stop offset="1" stopColor="#d88c9f" />
                </linearGradient>
                <pattern id="bloom-etch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(32)">
                    <path d="M0 0V5" stroke="#8f5a74" strokeOpacity=".28" strokeWidth="1" />
                </pattern>
                <path id="bloom-crescent" d="M257 92 A97 97 0 1 0 327 224 A84 84 0 0 1 257 92Z" />
                <path id="bloom-star" d="M0 -12 Q1 -2 9 0 Q1 2 0 12 Q-1 2 -9 0 Q-1 -2 0 -12Z" />
            </defs>
            <ellipse cx="240" cy="193" rx="221" ry="184" fill="url(#bloom-halo)" />
            {stardust.map(({ x, y, radius }, i) => (
                <circle key={i} className="cover-dust" cx={x} cy={y} r={radius}
                    fill={i % 3 ? "#f7cfdb" : "#dccbff"} style={{ animationDelay: `-${i % 13}s` }} />
            ))}
            <g fill="none" stroke="#e9bea9" strokeWidth=".85">
                <circle cx="238" cy="185" r="147" opacity=".55" />
                <circle className="cover-dial" cx="238" cy="185" r="142" strokeWidth="4" strokeDasharray="1 8.3" opacity=".6" />
                <circle cx="238" cy="185" r="132" opacity=".27" />
                <ellipse cx="238" cy="185" rx="188" ry="74" transform="rotate(-26 238 185)" opacity=".52" />
            </g>
            <g className="cover-moon">
                <use href="#bloom-crescent" fill="url(#bloom-gold)" />
                <use href="#bloom-crescent" fill="url(#bloom-etch)" stroke="#ffedc9" strokeWidth="1.1" />
            </g>
            <g className="cover-dial" fill="#ffdbbb">
                <circle cx="238" cy="38" r="3.6" /><circle cx="91" cy="185" r="2.6" />
                <circle cx="385" cy="185" r="2.2" />
            </g>
            <g stroke="#ecc1b1" strokeWidth=".9" fill="none">
                <path d="M196 326v22m42-16v34m42-40v14" />
                <path d="m238 365 4 7-4 7-4-7z" fill="#f1cead" />
            </g>
            <g fill="#ffe4b3">
                <use href="#bloom-star" transform="translate(196 350) scale(.45)" />
                <use href="#bloom-star" transform="translate(280 343) scale(.42)" />
                <use href="#bloom-star" transform="translate(284 170) scale(1.65)" />
                <use href="#bloom-star" transform="translate(305 142) scale(.55)" />
                <use href="#bloom-star" transform="translate(74 106) scale(.8)" />
                <use href="#bloom-star" transform="translate(397 245)" />
            </g>
            <path className="cover-meteor" d="m34 121 37-22" stroke="#ffe4db" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
    );
}

interface CoverProps {
    config: Pick<BirthdayConfig, "name" | "age" | "customMessage" | "showPhotoSection" | "showCakeSection">;
    cakeClicks: number;
    onCakeClick: () => void;
}

export default function BirthdayCover({ config, cakeClicks, onCakeClick }: CoverProps) {
    const wish = config.customMessage?.replace(/^周昱含，生日快乐[。！]\s*/, "");

    return (
        <header className="birthday-cover" aria-labelledby="cover-title">
            <div className="cover-card">
                <div className="cover-letterhead" aria-hidden="true">
                    <Flower2 size={19} /> 生日贺卡 <i /> ✧
                </div>
                <div className="cover-spread">
                    <div className="cover-letter">
                        <p className="cover-to">亲爱的{config.name}，</p>
                        <h1 id="cover-title">{config.age ? `${config.age} 岁` : ""}生日快乐</h1>
                        <p className="cover-script" lang="en" aria-hidden="true">Happy Birthday</p>
                        {wish && <p className="cover-wish">{wish.replace("，", "，\n")}</p>}
                        <div className="cover-links">
                            {config.showCakeSection && <a href="#cake-section"><CakeSlice size={18} />去许愿<ArrowDown size={15} /></a>}
                            {config.showPhotoSection && <a href="#memories"><BookOpen size={17} />翻开相册<ArrowUpRight size={15} /></a>}
                        </div>
                    </div>
                    <div className="cover-keepsakes">
                        <MoonDial />
                        <button type="button" className="cover-stamp" onClick={onCakeClick} aria-label="点点蛋糕，收集七次生日惊喜">
                            <CakeSlice size={26} strokeWidth={1.4} />
                            <span aria-live="polite">{cakeClicks ? `还差 ${7 - cakeClicks} 下` : "点点蛋糕"}</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
