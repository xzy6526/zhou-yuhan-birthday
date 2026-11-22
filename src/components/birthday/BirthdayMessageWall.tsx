import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Heart, MailOpen, Quote, Star } from "lucide-react";
import { useBirthdayStore } from "@/features/core/store/useBirthdayStore";
import "./BirthdayMessageWall.css";

interface Message {
    id: string;
    text: string;
    author?: string;
}

const collections = import.meta.glob<Message[]>("@/config/messages.local.json", {
    eager: true,
    import: "default",
});

export default function BirthdayMessageWall() {
    const { name, customMessage, senderName } = useBirthdayStore(state => state.config);
    const messages = Object.values(collections)[0] ?? (
        customMessage ? [{ id: "birthday-wish", text: customMessage, author: senderName }] : []
    );
    const [index, setIndex] = useState(-1);
    const [moving, setMoving] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const reduceMotion = useReducedMotion();
    const sealed = index < 0;
    const complete = index >= messages.length;
    const active = messages[index];
    const moveTo = (next: number) => {
        if (moving) return;
        setMoving(!reduceMotion);
        setIndex(next);
    };
    useEffect(() => {
        if (index >= 0) cardRef.current?.focus({ preventScroll: true });
    }, [index]);

    return (
        <section id="messages" className="message-wall" aria-labelledby="message-wall-title">
            <div className="message-wall__heading">
                <span className="message-wall__ornament" aria-hidden="true"><Star size={14} /><i /><Heart size={18} /><i /><Star size={14} /></span>
                <p className="message-wall__eyebrow">写在最后</p>
                <h2 id="message-wall-title">想对你说</h2>
                <p className="message-wall__subtitle">给{name}的 {messages.length} 封祝福，等你慢慢拆开。</p>
            </div>

            {messages.length ? (
                <div className="message-deck">
                    <div className="message-deck__papers" aria-hidden="true"><i /><i /></div>
                    <motion.div
                        key={index}
                        ref={cardRef}
                        tabIndex={-1}
                        className="message-deck__card"
                        data-tone={index % 3}
                        initial={reduceMotion ? false : { opacity: 0, y: 14, scale: .98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: reduceMotion ? 0 : .45, ease: "easeOut" }}
                        onAnimationComplete={() => setMoving(false)}
                    >
                        {sealed ? (
                            <div className="message-envelope">
                                <div className="message-envelope__seal" aria-hidden="true"><Heart size={29} fill="currentColor" strokeWidth={1} /></div>
                                <p className="message-envelope__to">周昱含，亲启</p>
                                <p className="message-envelope__hint">有人把牵挂和祝愿，写在了这里。</p>
                                <button type="button" className="message-deck__primary" disabled={moving} onClick={() => moveTo(0)}><MailOpen size={17} />拆开祝福</button>
                            </div>
                        ) : complete ? (
                            <div className="message-envelope message-envelope--complete">
                                <span className="message-envelope__finish" aria-hidden="true">✧</span>
                                <h3>把这些祝福，带进新的一岁</h3>
                                <p className="message-envelope__hint">愿被惦记的温暖，也陪着你过每一个平常日子。</p>
                                <button type="button" className="message-deck__primary" disabled={moving} onClick={() => moveTo(0)}>再读一次</button>
                            </div>
                        ) : (
                            <article className="message-note">
                                <span className="message-note__tape" aria-hidden="true" />
                                <Quote className="message-note__quote" size={23} strokeWidth={1.2} aria-hidden="true" />
                                <p className="message-note__text">{active.text}</p>
                                <div className="message-note__signature">
                                    <span>{active.author || "生日祝福"}</span>
                                    <Heart size={16} strokeWidth={1.4} aria-hidden="true" />
                                </div>
                            </article>
                        )}
                    </motion.div>
                    {!sealed && (
                        <nav className="message-deck__controls" aria-label="阅读祝福">
                            <div className="message-deck__progress">
                                <button type="button" aria-label="上一封祝福" disabled={moving || index === 0} onClick={() => moveTo(index - 1)}><ArrowLeft size={18} /></button>
                                <span role="status" aria-live="polite">{complete ? "祝福已收好" : `${index + 1} / ${messages.length}`}</span>
                                <span className="message-deck__progress-line" aria-hidden="true"><i style={{ width: `${Math.min(index + 1, messages.length) / messages.length * 100}%` }} /></span>
                            </div>
                            {!complete && <button type="button" className="message-deck__primary" disabled={moving} onClick={() => moveTo(index + 1)}>{index === messages.length - 1 ? "收好这些祝福" : "收好这张，读下一封"}<ArrowRight size={17} /></button>}
                        </nav>
                    )}
                </div>
            ) : <p className="message-wall__empty">有些话，想慢慢写给你。</p>}

            <p className="message-wall__closing">生日快乐，往后的平常日子也快乐。<span aria-hidden="true">✧</span></p>
        </section>
    );
}
