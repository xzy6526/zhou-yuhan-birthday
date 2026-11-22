import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
import type { ImgHTMLAttributes } from "react";
import type { MemoryAlbumData } from "@/config/localMemoryAlbum";
import "./BirthdayMemoryAlbum.css";

const asset = (id: string, thumbnail = false) =>
    `${import.meta.env.BASE_URL}memories/${thumbnail ? "thumb/" : ""}${id}.jpg`;

const MemoryImage = ({ id, thumbnail = false, ...props }: ImgHTMLAttributes<HTMLImageElement> & { id: string; thumbnail?: boolean }) => {
    return (
        <img {...props} src={asset(id, thumbnail)} loading="eager" decoding="async"
            onError={event => {
                const img = event.currentTarget;
                if (!img.dataset.fallback) {
                    img.dataset.fallback = "true";
                    img.src = asset(id, thumbnail).replace(/\.jpg$/, ".webp");
                } else {
                    img.alt = "照片加载失败，请点重新加载照片";
                }
            }}
        />
    );
};

const MemoryWall = ({ featured }: { featured: string[] }) => {
    const wallRef = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        const wall = wallRef.current;
        if (!wall) return;
        const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
        observer.observe(wall);
        return () => observer.disconnect();
    }, []);

    const lanes = Array.from({ length: 4 }, (_, lane) =>
        featured.filter((_, index) => index % 4 === lane),
    );

    return (
        <div ref={wallRef} className="memory-wall" data-moving={visible && !paused}>
            <div className="memory-wall__surface" aria-hidden="true">
                {lanes.map((lane, laneIndex) => (
                    <div className="memory-wall__lane" key={laneIndex}>
                        <div className="memory-wall__track">
                            {[0, 1].map(copy => (
                                <div className="memory-wall__tiles" key={copy}>
                                    {lane.map(id => (
                                        <MemoryImage key={id} id={id} thumbnail alt="" />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <button
                type="button"
                className="memory-wall__pause"
                aria-label="暂停照片墙"
                aria-pressed={paused}
                onClick={() => setPaused(value => !value)}
            >
                {paused ? <Play size={17} aria-hidden="true" /> : <Pause size={17} aria-hidden="true" />}
            </button>
        </div>
    );
};

const AlbumGrid = memo(function AlbumGrid({ album, onOpen }: { album: MemoryAlbumData; onOpen: (index: number) => void }) {
    let offset = 0;
    return (
        <div id="memory-photos" className="memory-album__groups">
            {album.groups.map(group => {
                const start = offset;
                offset += group.photos.length;
                return (
                    <div className="memory-album__group" data-layout={group.layout} key={group.title}>
                        <h3>{group.title}</h3>
                        <div className="memory-album__grid">
                            {group.photos.map((photo, i) => (
                                <figure key={photo.id}>
                                    <button
                                        type="button"
                                        aria-label={`查看${group.title}第${i + 1}张照片`}
                                        onClick={() => onOpen(start + i)}
                                    >
                                        <MemoryImage
                                            id={photo.id}
                                            thumbnail
                                            alt=""
                                            width={photo.width}
                                            height={photo.height}
                                        />
                                    </button>
                                    {photo.caption && <figcaption>{photo.caption}</figcaption>}
                                </figure>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

const BirthdayMemoryAlbum = ({ album }: { album: MemoryAlbumData }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [current, setCurrent] = useState<number | null>(null);
    const [retry, setRetry] = useState(0);
    const photos = useMemo(() => album.groups.flatMap(group => group.photos), [album.groups]);
    const openPhoto = useCallback((index: number) => {
        setCurrent(index);
        dialogRef.current?.showModal();
    }, []);
    const active = current === null ? null : photos[current];

    const step = (direction: number) => {
        setCurrent(index => index === null ? null : (index + direction + photos.length) % photos.length);
    };

    return (
        <section id="memories" className="memory-album relative z-20 mx-auto max-w-6xl px-4 py-16 sm:px-8" aria-labelledby="memory-album-title">
            <header className="memory-album__intro">
                <h2 id="memory-album-title">照片里的日子</h2>
                <a href="#memory-photos">浏览全部 {photos.length} 张 <span aria-hidden="true">↓</span></a>
                <button type="button" className="memory-album__retry" onClick={() => setRetry(value => value + 1)}>重新加载照片</button>
            </header>

            <MemoryWall key={`wall-${retry}`} featured={album.featured} />

            <AlbumGrid key={retry} album={album} onOpen={openPhoto} />

            <dialog
                ref={dialogRef}
                aria-label="浏览回忆照片"
                className="memory-viewer"
                onClose={() => setCurrent(null)}
                onClick={event => {
                    if (event.target === event.currentTarget) dialogRef.current?.close();
                }}
                onKeyDown={event => {
                    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                    event.preventDefault();
                    step(event.key === "ArrowLeft" ? -1 : 1);
                }}
            >
                {active && current !== null && (
                    <div className="memory-viewer__content">
                        <button type="button" className="memory-viewer__close" aria-label="关闭大图" onClick={() => dialogRef.current?.close()}>
                            <X size={20} aria-hidden="true" />
                        </button>
                        <MemoryImage
                            key={`${active.id}-${retry}`}
                            id={active.id}
                            className="memory-viewer__photo"
                            alt={active.caption || `回忆照片 ${current + 1}`}
                            width={active.width}
                            height={active.height}
                        />
                        {active.caption && <p className="memory-viewer__caption">{active.caption}</p>}
                        <div className="memory-viewer__nav">
                            <button type="button" aria-label="上一张" onClick={() => step(-1)}><ChevronLeft size={22} aria-hidden="true" /></button>
                            <span role="status">{current + 1} / {photos.length}</span>
                            <button type="button" aria-label="下一张" onClick={() => step(1)}><ChevronRight size={22} aria-hidden="true" /></button>
                        </div>
                    </div>
                )}
            </dialog>
        </section>
    );
};

export default BirthdayMemoryAlbum;
