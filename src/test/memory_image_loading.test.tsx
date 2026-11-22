import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import BirthdayMemoryAlbum from "@/components/birthday/BirthdayMemoryAlbum";

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

it("assigns sources without observer callbacks, defers thumbnails and eagerly opens the full photo", () => {
    vi.stubGlobal("IntersectionObserver", class {
        observe() {}
        disconnect() {}
    });
    const album = {
        featured: ["01"],
        groups: [{ title: "校园", photos: [{ id: "01", width: 640, height: 480 }] }],
    };
    const { container } = render(<BirthdayMemoryAlbum album={album} />);
    const photo = container.querySelector(".memory-album__grid img") as HTMLImageElement;
    expect(photo).toHaveAttribute("loading", "lazy");
    expect(photo.src).toMatch(/01\.webp$/);
    fireEvent.error(photo);
    expect(photo.src).toMatch(/01\.jpg$/);
    fireEvent.error(photo);
    expect(photo.alt).toContain("重新加载照片");
    fireEvent.click(screen.getByRole("button", { name: "重新加载照片" }));
    const retry = container.querySelector(".memory-album__grid img") as HTMLImageElement;
    expect(retry).not.toBe(photo);
    expect(retry.src).toMatch(/01\.webp$/);
    expect(retry.dataset.fallback).toBeUndefined();
    Object.assign(container.querySelector("dialog")!, { showModal: vi.fn() });
    fireEvent.click(screen.getByRole("button", { name: "查看校园第1张照片" }));
    expect(container.querySelector(".memory-viewer__photo")).toHaveAttribute("loading", "eager");
});
