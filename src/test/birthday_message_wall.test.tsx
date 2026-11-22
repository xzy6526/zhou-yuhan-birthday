import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import BirthdayMessageWall from "@/components/birthday/BirthdayMessageWall";

vi.mock("framer-motion", async () => ({
    ...await vi.importActual("framer-motion"),
    useReducedMotion: () => true,
}));
vi.mock("@/features/core/store/useBirthdayStore", () => ({
    useBirthdayStore: (select: (state: unknown) => unknown) => select({
        config: { name: "周昱含", customMessage: "生日快乐", senderName: "测试" },
    }),
}));
afterEach(cleanup);

it("opens the stack, finishes once, and allows going back and replaying with reduced motion", () => {
    const { container } = render(<BirthdayMessageWall />);
    const subtitle = container.querySelector(".message-wall__subtitle")!.textContent!;
    const total = Number(subtitle.match(/(\d+) 封祝福/)![1]);
    expect(container.querySelector("article")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "拆开祝福" }));
    expect(screen.getByRole("button", { name: "上一封祝福" })).toBeDisabled();
    for (let i = 1; i <= total; i++) {
        expect(screen.getByRole("status")).toHaveTextContent(`${i} / ${total}`);
        expect(container.querySelectorAll("article")).toHaveLength(1);
        fireEvent.click(screen.getByRole("button", { name: /收好这张，读下一封|收好这些祝福/ }));
    }
    expect(screen.getByRole("heading", { name: "把这些祝福，带进新的一岁" })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("祝福已收好");
    fireEvent.click(screen.getByRole("button", { name: "上一封祝福" }));
    expect(screen.getByRole("status")).toHaveTextContent(`${total} / ${total}`);
    fireEvent.click(screen.getByRole("button", { name: "收好这些祝福" }));
    fireEvent.click(screen.getByRole("button", { name: "再读一次" }));
    expect(screen.getByRole("status")).toHaveTextContent(`1 / ${total}`);
    expect(container.querySelector(".message-deck__card")).toHaveFocus();
});
