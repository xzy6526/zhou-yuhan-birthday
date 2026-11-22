import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import BirthdayMemoryAlbum from "@/components/birthday/BirthdayMemoryAlbum";

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

it("defers offscreen photo requests without observers, loads nearby photos and eagerly opens the full photo", async () => {
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
    expect(photo).not.toHaveAttribute("src");
    const bounds = photo.getBoundingClientRect();
    vi.spyOn(photo, "getBoundingClientRect").mockReturnValue({ ...bounds, top: 5000, bottom: 5480, width: 640 });
    fireEvent.scroll(window);
    await new Promise(resolve => setTimeout(resolve, 40));
    expect(photo).not.toHaveAttribute("src");
    vi.mocked(photo.getBoundingClientRect).mockReturnValue({ ...bounds, top: 100, bottom: 580, width: 640 });
    fireEvent.scroll(window);
    await waitFor(() => expect(photo.src).toMatch(/01\.webp$/));
    fireEvent.error(photo);
    expect(photo.src).toMatch(/01\.jpg$/);
    fireEvent.error(photo);
    expect(photo.alt).toContain("重新加载照片");
    fireEvent.click(screen.getByRole("button", { name: "重新加载照片" }));
    const retry = container.querySelector(".memory-album__grid img") as HTMLImageElement;
    expect(retry).not.toBe(photo);
    expect(retry).not.toHaveAttribute("src");
    expect(retry.dataset.fallback).toBeUndefined();
    Object.assign(container.querySelector("dialog")!, { showModal: vi.fn() });
    fireEvent.click(screen.getByRole("button", { name: "查看校园第1张照片" }));
    expect(container.querySelector(".memory-viewer__photo")).toHaveAttribute("loading", "eager");
});
