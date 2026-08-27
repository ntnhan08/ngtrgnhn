/* Social networks — icons ONLY, bundled locally as inline SVG paths.
 * URLs are never displayed; hovering shows the network-name tooltip. */
import type { CSSProperties } from "react";
import type { SocialLink, SocialNetworkId } from "../../types";
import { cn } from "../../utils/format";
import { Tip } from "../ui/Primitives";

interface BrandDef {
  label: string;
  brand: string;
  path: string;
}

/* compact brand glyph paths on a 24px grid */
export const BRAND_ICONS: Record<SocialNetworkId, BrandDef> = {
  facebook: {
    label: "Facebook",
    brand: "#1877f2",
    path: "M13.5 21v-7h2.4l.4-2.8h-2.8V9.4c0-.8.3-1.4 1.5-1.4h1.4V5.5c-.6-.1-1.5-.2-2.4-.2-2.3 0-3.7 1.4-3.7 3.7v2.2H8v2.8h2.3v7h3.2z",
  },
  instagram: {
    label: "Instagram",
    brand: "#e1306c",
    path: "M12 5.4c2.1 0 2.4 0 3.2.1 2.1.1 3.1 1.1 3.2 3.2.1.8.1 1.1.1 3.3s0 2.4-.1 3.2c-.1 2.1-1.1 3.1-3.2 3.2-.8.1-1.1.1-3.2.1s-2.4 0-3.2-.1c-2.1-.1-3.1-1.1-3.2-3.2-.1-.8-.1-1.1-.1-3.2s0-2.4.1-3.3C5.7 6.5 6.7 5.5 8.8 5.4c.8 0 1.1-.1 3.2-.1zM12 3.6c-2.2 0-2.5 0-3.3.1-3 .1-4.7 1.8-4.9 4.8-.1.9-.1 1.2-.1 3.5s0 2.6.1 3.5c.1 3 1.8 4.7 4.9 4.8.9.1 1.2.1 3.3.1s2.5 0 3.3-.1c3-.1 4.7-1.8 4.9-4.8.1-.9.1-1.2.1-3.5s0-2.6-.1-3.5c-.1-3-1.8-4.7-4.9-4.8-.8-.1-1.1-.1-3.3-.1zm0 4.3a4.1 4.1 0 1 0 0 8.2 4.1 4.1 0 0 0 0-8.2zm0 6.8a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4zm4.3-7a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  },
  tiktok: {
    label: "TikTok",
    brand: "#0f0f0f",
    path: "M16.6 3c.3 1.9 1.5 3.4 3.4 3.7v2.9c-1.3 0-2.5-.4-3.4-1.1v6.1c0 3.5-2.4 5.9-5.7 5.9-3.2 0-5.7-2.3-5.7-5.5 0-3.3 2.6-5.7 6-5.6v3c-.3-.1-.6-.2-1-.2-1.6 0-2.8 1.1-2.8 2.7 0 1.6 1.2 2.7 2.8 2.7 1.7 0 2.9-1.1 2.9-3V3h3.5z",
  },
  youtube: {
    label: "YouTube",
    brand: "#ff0000",
    path: "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15.2V8.8l5.2 3.2L10 15.2z",
  },
  github: {
    label: "GitHub",
    brand: "#24292f",
    path: "M12 3a9 9 0 0 0-2.8 17.5c.5.1.6-.2.6-.4v-1.7c-2.5.5-3-1-3-1-.4-1-1-1.3-1-1.3-.8-.6.1-.6.1-.6.9.1 1.4 1 1.4 1 .8 1.4 2.1 1 2.6.7.1-.6.3-1 .6-1.2-2-.2-4.1-1-4.1-4.5 0-1 .3-1.8 1-2.4-.1-.3-.4-1.2.1-2.4 0 0 .7-.2 2.4.9a8.3 8.3 0 0 1 4.4 0c1.7-1.1 2.4-.9 2.4-.9.5 1.2.2 2.1.1 2.4.6.6 1 1.4 1 2.4 0 3.5-2.1 4.3-4.1 4.5.3.3.6.8.6 1.6v2.3c0 .2.1.5.6.4A9 9 0 0 0 12 3z",
  },
  linkedin: {
    label: "LinkedIn",
    brand: "#0a66c2",
    path: "M6.9 8.9H4V20h2.9V8.9zM5.4 7.6a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4zM20 20h-2.9v-5.6c0-1.3-.5-2.2-1.7-2.2-.9 0-1.4.6-1.6 1.2-.1.2-.1.5-.1.8V20h-2.9V8.9h2.9v1.5c.4-.6 1.1-1.5 2.7-1.5 2 0 3.6 1.3 3.6 4.2V20z",
  },
  zalo: {
    label: "Zalo",
    brand: "#0068ff",
    path: "M12 3.5c-4.7 0-8.5 3.2-8.5 7.2 0 2.3 1.3 4.3 3.3 5.6-.1.9-.5 2.2-1.4 3 1.8-.2 3.3-1 4.3-1.7.7.2 1.5.3 2.3.3 4.7 0 8.5-3.2 8.5-7.2S16.7 3.5 12 3.5zM8.7 12.9H7.2V9.3H6v-1.2h4v1.2H8.7v3.6zm3.9 0h-2.8V8.1h1.3v3.7h1.5v1.1zm4.2 0h-2.9V8.1h2.9v1.1h-1.6v.6h1.5v1h-1.5v.9h1.6v1.2z",
  },
  x: {
    label: "X",
    brand: "#0f1419",
    path: "M17.8 3h3l-6.6 7.6L22 21h-6.1l-4.8-6.3L5.6 21h-3l7.1-8.1L2 3h6.3l4.3 5.7L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z",
  },
  discord: {
    label: "Discord",
    brand: "#5865f2",
    path: "M19.3 5.3A16.9 16.9 0 0 0 15.1 4l-.5 1a15.6 15.6 0 0 0-5.2 0L8.9 4a16.9 16.9 0 0 0-4.2 1.3C2 9.3 1.3 13.2 1.6 17a17 17 0 0 0 5.2 2.6l1.1-1.8c-.6-.2-1.2-.5-1.7-.9l.4-.3c3.3 1.5 6.9 1.5 10.2 0l.4.3c-.5.4-1.1.7-1.7.9l1.1 1.8a17 17 0 0 0 5.2-2.6c.4-4.4-.7-8.3-2.5-11.7zM8.7 14.7c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.9.9 1.8 2c0 1.1-.8 2-1.8 2zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.9.9 1.8 2c0 1.1-.8 2-1.8 2z",
  },
  telegram: {
    label: "Telegram",
    brand: "#26a5e4",
    path: "M21.9 4.6 19 18.4c-.2 1-.8 1.2-1.6.8l-4.4-3.3-2.1 2c-.2.3-.5.5-.9.5l.3-4.4 8-7.2c.4-.3-.1-.5-.5-.2L7.9 12.8l-4.3-1.3c-.9-.3-.9-.9.2-1.4L20.6 3.3c.8-.3 1.5.2 1.3 1.3z",
  },
  threads: {
    label: "Threads",
    brand: "#101010",
    path: "M12 3.5c-4.8 0-8 3.2-8.1 8.4v.2c.1 5.2 3.3 8.4 8.1 8.4 2.9 0 5.1-1.2 6.5-3.4.7-1.1 1.1-2.4 1.3-3.9-1.2 1.5-2.9 2.5-4.9 2.9 1.2.6 2.2 1.4 2.8 2.5-1.1 1-2.6 1.5-4.3 1.5-3 0-5-2.2-5-5.5v-.3c0-3.3 2-5.5 5-5.5 2.2 0 3.9 1 4.8 2.9l1.8-.9c-1.1-2.4-3.3-3.7-6-3.7zm1 9.3c-.3 0-.7 0-1 .1-1.6.3-2.6 1.3-2.5 2.5 0 .9.8 1.6 1.9 1.6 1.3 0 2.3-.6 2.7-1.7.2-.5.3-1.1.3-1.7-.5-.5-1-.8-1.4-.8z",
  },
  snapchat: {
    label: "Snapchat",
    brand: "#fffc00",
    path: "M12 3.5c-2.9 0-5 2.2-5 5.2 0 .6-.1 1.2-.2 1.7-.3 0-.7-.3-1-.3-.3 0-.6.2-.6.5 0 .5.8.8 1.4 1 .4.1.4.5.3.8-.4 1-1.4 1.7-2.4 2-.3.1-.4.4-.2.6.5.6 1.6.9 2.4 1 .1.4-.1.9 0 1.2.1.2.3.3.5.3.4 0 .9-.2 1.5-.2.4 0 .8.1 1.2.3.7.5 1.2 1.4 2.1 1.4s1.4-.9 2.1-1.4c.4-.2.8-.3 1.2-.3.6 0 1.1.2 1.5.2.2 0 .5-.1.5-.3.1-.3-.1-.8 0-1.2.8-.1 1.9-.4 2.4-1 .2-.2.1-.5-.2-.6-1-.3-2-1-2.4-2-.1-.3-.1-.7.3-.8.6-.2 1.4-.5 1.4-1 0-.3-.3-.5-.6-.5-.3 0-.7.3-1 .3-.1-.5-.2-1.1-.2-1.7 0-3-2.1-5.2-5-5.2z",
  },
};

export function BrandIcon({
  id,
  size = 16,
  className,
}: {
  id: SocialNetworkId;
  size?: number;
  className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d={BRAND_ICONS[id].path} />
    </svg>
  );
}

/** Icon-only links: enabled + non-empty URL required, otherwise nothing renders. */
export function SocialLinks({
  social,
  size = "sm",
  className,
}: {
  social: Partial<Record<SocialNetworkId, SocialLink>>;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const entries = (Object.keys(social) as SocialNetworkId[]).filter((id) => {
    const s = social[id];
    return s && s.enabled && s.url.trim().length > 0;
  });

  if (entries.length === 0) return null;

  const dims =
    size === "lg" ? "h-11 w-11 rounded-[8px]" : size === "sm" ? "h-8 w-8 rounded-[6px]" : "h-9 w-9 rounded-[7px]";
  const iconSize = size === "lg" ? 19 : size === "sm" ? 14 : 16;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {entries.map((id) => {
        const def = BRAND_ICONS[id];
        const url = social[id]!.url.trim();
        return (
          <Tip key={id} label={def.label}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={def.label}
              onClick={(e) => e.stopPropagation()}
              style={{ "--brand": def.brand } as CSSProperties}
              className={cn(
                "social-btn inline-flex items-center justify-center border-2 border-inkline bg-raised text-muted",
                dims
              )}
            >
              <BrandIcon id={id} size={iconSize} />
            </a>
          </Tip>
        );
      })}
    </div>
  );
}