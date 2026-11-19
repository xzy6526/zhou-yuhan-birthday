import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import BirthdayCover from "@/components/birthday/BirthdayCover";

const config = { name: "周昱含", age: null, customMessage: "愿你天天开心。", showPhotoSection: true, showCakeSection: true };
afterEach(cleanup);

it("keeps photos off the cover while linking to both sections", () => {
    const { container } = render(<BirthdayCover config={config} cakeClicks={0} onCakeClick={vi.fn()} />);
    expect(container.querySelector("img, image")).toBeNull();
    expect(container.querySelector(".cover-sky")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "去许愿" })).toHaveAttribute("href", "#cake-section");
    expect(screen.getByRole("link", { name: "翻开相册" })).toHaveAttribute("href", "#memories");
});

it("omits cover photos and links for hidden sections", () => {
    render(<BirthdayCover config={{ ...config, showPhotoSection: false, showCakeSection: false }} cakeClicks={0} onCakeClick={vi.fn()} />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByRole("heading", { name: "生日快乐" })).toBeVisible();
});
