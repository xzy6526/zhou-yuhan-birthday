import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import BirthdayCover from "@/components/birthday/BirthdayCover";

const config = { name: "周昱含", age: null, customMessage: "愿你天天开心。", showPhotoSection: true, showCakeSection: true };
const album = { featured: [], groups: [{ title: "测试", photos: [{ id: "14", width: 3, height: 4 }] }] };
afterEach(cleanup);

it("only shows cover photos present in the local album and links to both sections", () => {
    render(<BirthdayCover config={config} album={album} cakeClicks={0} onCakeClick={vi.fn()} />);
    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "去许愿" })).toHaveAttribute("href", "#cake-section");
    expect(screen.getByRole("link", { name: "翻开相册" })).toHaveAttribute("href", "#memories");
});

it("omits cover photos and links for hidden sections", () => {
    render(<BirthdayCover config={{ ...config, showPhotoSection: false, showCakeSection: false }} album={album} cakeClicks={0} onCakeClick={vi.fn()} />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByRole("heading", { name: "生日快乐" })).toBeVisible();
});
