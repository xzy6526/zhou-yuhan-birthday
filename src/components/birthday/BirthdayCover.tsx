import { ArrowDown, ArrowUpRight, BookOpen, CakeSlice, Flower2 } from "lucide-react";
import type { MemoryAlbumData } from "@/config/localMemoryAlbum";
import type { BirthdayConfig } from "@/features/core/store/useBirthdayStore";
import "./BirthdayCover.css";

const prints = [
    { id: "14", style: "portrait", caption: "街角的一抹红", alt: "街边的红裙人像" },
    { id: "23", style: "landscape", caption: "在操场，一起比个耶", alt: "四位同学在操场上比着剪刀手合影" },
];

interface CoverProps {
    config: Pick<BirthdayConfig, "name" | "age" | "customMessage" | "showPhotoSection" | "showCakeSection">;
    album: MemoryAlbumData;
    cakeClicks: number;
    onCakeClick: () => void;
}

export default function BirthdayCover({ config, album, cakeClicks, onCakeClick }: CoverProps) {
    const photos = config.showPhotoSection ? prints.filter(print =>
        album.groups.some(group => group.photos.some(photo => photo.id === print.id))) : [];
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
                        <div className="cover-orbits" aria-hidden="true"><i /><i /><i /></div>
                        <span className="cover-glint" aria-hidden="true">✦</span>
                        {photos.map(photo => (
                            <figure className={`cover-print cover-print--${photo.style}`} key={photo.id}>
                                <img src={`${import.meta.env.BASE_URL}memories/thumb/${photo.id}.webp`} alt={photo.alt} />
                                <figcaption>{photo.caption}</figcaption>
                            </figure>
                        ))}
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
