/* Pixel item-slot avatar — square, dark outline, inset bevel, hard shadow.
 * Falls back to a monogram when no photo is set. */
import { useEffect, useState } from "react";
import { resolveAvatarUrl } from "../services/images";
import { avatarPalette, cn, initialsOf } from "../utils/format";

export function useAvatarUrl(
  avatarId: string | null | undefined,
  avatarPath?: string
): string | null {
  const [url, setUrl] = useState<string | null>(avatarPath ?? null);

  useEffect(() => {
    let alive = true;
    if (avatarPath) {
      setUrl(avatarPath);
      return;
    }
    if (!avatarId) {
      setUrl(null);
      return;
    }
    resolveAvatarUrl(avatarId)
      .then((u) => {
        if (alive) setUrl(u);
      })
      .catch(() => {
        if (alive) setUrl(null);
      });
    return () => {
      alive = false;
    };
  }, [avatarId, avatarPath]);

  return url;
}

export function Avatar({
  name,
  avatarId,
  avatarPath,
  size = 48,
  ring = false,
  className,
}: {
  name: string;
  avatarId?: string | null;
  avatarPath?: string;
  size?: number;
  ring?: boolean;
  className?: string;
}) {
  const url = useAvatarUrl(avatarId, avatarPath);
  const [failed, setFailed] = useState(false);
  const palette = avatarPalette(name || "?");
  const showImage = Boolean(url && !failed);
  const radius = Math.max(2, Math.round(size * 0.045));

  return (
    <div
      className={cn("relative shrink-0 select-none overflow-hidden", className)}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        border: "3px solid var(--inkline)",
        boxShadow: ring
          ? "5px 6px 0 var(--shadow-ink), inset 2px 2px 0 rgba(0,0,0,0.3), inset -2px -2px 0 rgba(255,255,255,0.2), 0 0 0 5px var(--raised)"
          : "4px 4px 0 var(--shadow-ink), inset 2px 2px 0 rgba(0,0,0,0.3), inset -2px -2px 0 rgba(255,255,255,0.2)",
        background: "var(--raised)",
      }}
      aria-hidden="true"
    >
      {showImage ? (
        <img
          src={url ?? undefined}
          alt=""
          draggable={false}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)`,
          }}
        >
          <span
            className="font-heading font-black text-white"
            style={{
              fontSize: Math.round(size * 0.36),
              textShadow: "2px 2px 0 rgba(0,0,0,0.4)",
            }}
          >
            {initialsOf(name)}
          </span>
        </div>
      )}
    </div>
  );
}
