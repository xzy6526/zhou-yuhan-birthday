interface MemoryPhoto {
    id: string;
    width: number;
    height: number;
    caption?: string;
}

export interface MemoryAlbumData {
    featured: string[];
    groups: { title: string; layout?: "polaroid" | "film" | "editorial"; photos: MemoryPhoto[] }[];
}

const albums = import.meta.glob<MemoryAlbumData>("./*-album.local.json", {
    eager: true,
    import: "default",
});
export const localMemoryAlbum = albums["./memory-album.local.json"];
