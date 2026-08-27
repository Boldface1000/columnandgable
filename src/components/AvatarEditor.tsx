import { useRef, useState } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { isImageAvatar, uploadAvatar } from "@/lib/app-state";

export function AvatarEditor({
  avatar,
  onUploaded,
}: {
  avatar?: string | null;
  onUploaded: (url: string) => Promise<void> | void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = (f: File | null) => {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
  };

  const save = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadAvatar(file);
      await onUploaded(url);
      toast.success("Profile photo updated");
      setOpen(false);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="relative shrink-0">
        {isImageAvatar(avatar) ? (
          <img src={avatar} alt="Profile" className="size-16 rounded-full object-cover" />
        ) : (
          <span className="grid size-16 place-items-center rounded-full bg-muted text-3xl">
            {avatar || "🦅"}
          </span>
        )}
        <button
          type="button"
          aria-label="Edit profile photo"
          onClick={() => setOpen(true)}
          className="gold-surface absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full shadow-gold"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile photo</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            {preview ? (
              <img src={preview} alt="Preview" className="size-28 rounded-full object-cover" />
            ) : isImageAvatar(avatar) ? (
              <img src={avatar} alt="Current" className="size-28 rounded-full object-cover" />
            ) : (
              <span className="grid size-28 place-items-center rounded-full bg-muted text-5xl">
                {avatar || "🦅"}
              </span>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold"
            >
              Choose image
            </button>
            <p className="text-xs text-muted-foreground">JPEG, PNG or WEBP · up to 5MB</p>
          </div>

          <DialogFooter>
            <button
              disabled={!file || busy}
              onClick={() => void save()}
              className="gold-surface flex h-12 w-full items-center justify-center rounded-full font-bold shadow-gold disabled:opacity-40"
            >
              {busy ? <Loader2 className="size-5 animate-spin" /> : "Save photo"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
