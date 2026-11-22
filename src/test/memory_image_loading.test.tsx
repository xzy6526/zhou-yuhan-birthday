import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import BirthdayMemoryAlbum from "@/components/birthday/BirthdayMemoryAlbum";

vi.mock("framer-motion", () => ({ useInView: () => true }));
afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

it("starts nearby images explicitly, falls back after failure and resets failed images on retry", () => {
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
    expect(photo).toHaveAttribute("loading", "eager");
    expect(photo.src).toMatch(/01\.jpg$/);
    fireEvent.error(photo);
    expect(photo.src).toMatch(/01\.webp$/);
    fireEvent.error(photo);
    expect(photo.alt).toContain("重新加载照片");
    fireEvent.click(screen.getByRole("button", { name: "重新加载照片" }));
    const retry = container.querySelector(".memory-album__grid img") as HTMLImageElement;
    expect(retry).not.toBe(photo);
    expect(retry.src).toMatch(/01\.jpg$/);
    expect(retry.dataset.fallback).toBeUndefined();
});
