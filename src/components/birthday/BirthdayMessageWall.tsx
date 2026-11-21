import { Heart, Quote, Star } from "lucide-react";
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

    return (
        <section id="messages" className="message-wall" aria-labelledby="message-wall-title">
            <div className="message-wall__heading">
                <span className="message-wall__ornament" aria-hidden="true"><Star size={14} /><i /><Heart size={18} /><i /><Star size={14} /></span>
                <p className="message-wall__eyebrow">写在最后</p>
                <h2 id="message-wall-title">想对你说</h2>
                <p className="message-wall__subtitle">给{name}，也给每一个值得珍藏的日子。</p>
            </div>

            {messages.length ? (
                <div className="message-wall__notes">
                    {messages.map(message => (
                        <article className="message-note" key={message.id}>
                            <span className="message-note__tape" aria-hidden="true" />
                            <Quote className="message-note__quote" size={23} strokeWidth={1.2} aria-hidden="true" />
                            <p className="message-note__text">{message.text}</p>
                            <div className="message-note__signature">
                                <span>{message.author || "生日祝福"}</span>
                                <Heart size={16} strokeWidth={1.4} aria-hidden="true" />
                            </div>
                        </article>
                    ))}
                </div>
            ) : <p className="message-wall__empty">有些话，想慢慢写给你。</p>}

            <p className="message-wall__closing">生日快乐，往后的平常日子也快乐。<span aria-hidden="true">✧</span></p>
        </section>
    );
}
