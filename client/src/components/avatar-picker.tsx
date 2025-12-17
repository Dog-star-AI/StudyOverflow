import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type DiceBearStyle =
  | "adventurer"
  | "adventurer-neutral"
  | "avataaars"
  | "avataaars-neutral"
  | "big-ears"
  | "big-ears-neutral"
  | "big-smile"
  | "bottts"
  | "bottts-neutral"
  | "croodles"
  | "croodles-neutral"
  | "fun-emoji"
  | "icons"
  | "identicon"
  | "initials"
  | "lorelei"
  | "lorelei-neutral"
  | "micah"
  | "miniavs"
  | "notionists"
  | "notionists-neutral"
  | "open-peeps"
  | "personas"
  | "pixel-art"
  | "pixel-art-neutral"
  | "rings"
  | "shapes"
  | "thumbs";

const STYLES: { id: DiceBearStyle; label: string }[] = [
  { id: "adventurer", label: "Adventurer" },
  { id: "adventurer-neutral", label: "Adventurer Neutral" },
  { id: "avataaars", label: "Avataaars" },
  { id: "avataaars-neutral", label: "Avataaars Neutral" },
  { id: "big-ears", label: "Big Ears" },
  { id: "big-ears-neutral", label: "Big Ears Neutral" },
  { id: "big-smile", label: "Big Smile" },
  { id: "bottts", label: "Bottts" },
  { id: "bottts-neutral", label: "Bottts Neutral" },
  { id: "croodles", label: "Croodles" },
  { id: "croodles-neutral", label: "Croodles Neutral" },
  { id: "fun-emoji", label: "Fun Emoji" },
  { id: "icons", label: "Icons" },
  { id: "identicon", label: "Identicon" },
  { id: "initials", label: "Initials" },
  { id: "lorelei", label: "Lorelei" },
  { id: "lorelei-neutral", label: "Lorelei Neutral" },
  { id: "micah", label: "Micah" },
  { id: "miniavs", label: "Miniavs" },
  { id: "notionists", label: "Notionists" },
  { id: "notionists-neutral", label: "Notionists Neutral" },
  { id: "open-peeps", label: "Open Peeps" },
  { id: "personas", label: "Personas" },
  { id: "pixel-art", label: "Pixel Art" },
  { id: "pixel-art-neutral", label: "Pixel Art Neutral" },
  { id: "rings", label: "Rings" },
  { id: "shapes", label: "Shapes" },
  { id: "thumbs", label: "Thumbs" },
];

function urlFor(style: DiceBearStyle, seed: string): string {
  const s = encodeURIComponent(seed || "Student");
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${s}&radius=50&backgroundType=gradientLinear`;
}

function StyleGalleryModal({
  open,
  onOpenChange,
  onSelectStyle,
  seed,
  currentStyle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectStyle: (style: DiceBearStyle) => void;
  seed: string;
  currentStyle: DiceBearStyle;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return STYLES.filter((s) =>
      s.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Browse Avatar Styles</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="gallery-search">Search styles</Label>
            <Input
              id="gallery-search"
              placeholder="e.g. pixel, adventurer, emoji..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filtered.length} of {STYLES.length} styles
          </div>
          <ScrollArea className="h-[400px] rounded-md border p-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 pr-4">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onSelectStyle(s.id);
                    onOpenChange(false);
                  }}
                  className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-colors ${
                    currentStyle === s.id
                      ? "bg-primary/10 ring-1 ring-primary"
                      : "hover:bg-muted"
                  }`}
                  title={s.label}
                >
                  <img
                    src={urlFor(s.id, seed)}
                    alt={s.label}
                    className="h-12 w-12 rounded-full border"
                    loading="lazy"
                  />
                  <div className="text-xs text-center line-clamp-2 text-muted-foreground">
                    {s.label}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AvatarPicker({
  value,
  onChange,
  initialSeed,
  className,
}: {
  value?: string | null;
  onChange: (url: string) => void;
  initialSeed?: string;
  className?: string;
}) {
  const [seed, setSeed] = useState(initialSeed ?? "");
  const [selectedStyle, setSelectedStyle] = useState<DiceBearStyle>("thumbs");
  const [galleryOpen, setGalleryOpen] = useState(false);

  const previewUrl = useMemo(() => urlFor(selectedStyle, seed), [selectedStyle, seed]);

  useEffect(() => {
    if (value) {
      try {
        const u = new URL(value);
        const parts = u.pathname.split("/").filter(Boolean);
        const style = parts[2] as DiceBearStyle | undefined;
        const urlSeed = u.searchParams.get("seed") ?? seed;
        if (style && STYLES.find((s) => s.id === style)) {
          setSelectedStyle(style);
        }
        setSeed(urlSeed);
      } catch {
        // ignore parsing errors
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onChange(previewUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrl]);

  function randomize() {
    const newSeed = Math.random().toString(36).slice(2, 10);
    setSeed(newSeed);
  }

  const currentStyleLabel = STYLES.find((s) => s.id === selectedStyle)?.label || selectedStyle;

  return (
    <div className={className}>
      <div className="grid gap-3 md:grid-cols-[1fr_auto] items-end">
        <div className="space-y-2">
          <Label htmlFor="avatar-seed">Avatar seed</Label>
          <div className="flex gap-2">
            <Input
              id="avatar-seed"
              placeholder="e.g. your name"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
            />
            <Button type="button" variant="outline" onClick={randomize}>
              Randomize
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="avatar-style">Quick select</Label>
          <Select value={selectedStyle} onValueChange={(v) => setSelectedStyle(v as DiceBearStyle)}>
            <SelectTrigger id="avatar-style" className="min-w-[220px]">
              <SelectValue placeholder="Choose a style" />
            </SelectTrigger>
            <SelectContent>
              {STYLES.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-16 w-16 md:h-20 md:w-20 rounded-full border overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
          <img src={previewUrl} alt="Avatar preview" className="h-full w-full object-cover" loading="lazy" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{currentStyleLabel}</div>
          <div className="text-xs text-muted-foreground truncate" title={previewUrl}>
            Seed: {seed || "(default)"}
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(previewUrl)}>
          Copy URL
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <Button type="button" onClick={() => onChange(previewUrl)}>
          Use Avatar
        </Button>
        <Button type="button" variant="outline" onClick={() => setGalleryOpen(true)}>
          Browse All Styles
        </Button>
        {value && (
          <a href={value} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground underline">
            Open URL
          </a>
        )}
      </div>

      <StyleGalleryModal
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        onSelectStyle={(style) => setSelectedStyle(style)}
        seed={seed}
        currentStyle={selectedStyle}
      />
    </div>
  );
}

export default AvatarPicker;
