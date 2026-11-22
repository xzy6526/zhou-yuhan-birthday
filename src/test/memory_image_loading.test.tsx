import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import BirthdayMemoryAlbum from "@/components/birthday/BirthdayMemoryAlbum";

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
});

it("releases stalled download slots after bounded fallback attempts", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top: 100, bottom: 580, width: 640 } as DOMRect);
    const album = { featured: [], groups: [{ title: "校园", photos: ["01", "02", "03", "04"].map(id => ({ id, width: 640, height: 480 })) }] };
    const { container } = render(<BirthdayMemoryAlbum album={album} />);
    const photos = [...container.querySelectorAll(".memory-album__grid img")];
    await act(async () => { await vi.advanceTimersByTimeAsync(40); });
    expect(photos[3]).not.toHaveAttribute("src");
    await act(async () => { await vi.advanceTimersByTimeAsync(12000); });
    expect(photos[0]).toHaveAttribute("src", "/memories/thumb/01.jpg?v=7");
    await act(async () => { await vi.advanceTimersByTimeAsync(12040); });
    expect(photos[0]).not.toHaveAttribute("src");
    expect(photos[0]).toHaveAttribute("alt", expect.stringContaining("重新加载"));
    expect(photos[3]).toHaveAttribute("src", "/memories/thumb/04.webp?v=7");
});

it("limits nearby downloads and starts the next photo when one finishes", async () => {
    vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top: 100, bottom: 580, width: 640 } as DOMRect);
    const album = { featured: [], groups: [{ title: "校园", photos: ["01", "02", "03", "04"].map(id => ({ id, width: 640, height: 480 })) }] };
    const { container } = render(<BirthdayMemoryAlbum album={album} />);
    const photos = [...container.querySelectorAll(".memory-album__grid img")];
    await waitFor(() => expect(photos.filter(photo => photo.hasAttribute("src"))).toHaveLength(3));
    expect(photos[3]).not.toHaveAttribute("src");
    fireEvent.load(photos[0]);
    await waitFor(() => expect(photos[3]).toHaveAttribute("src"));
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
    await waitFor(() => expect(photo.src).toMatch(/01\.webp\?v=7$/));
    fireEvent.error(photo);
    expect(photo.src).toMatch(/01\.jpg\?v=7$/);
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
