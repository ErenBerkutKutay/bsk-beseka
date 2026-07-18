import { BESEKA_SOCIAL_LINKS } from "@/lib/beseka/social-links";

function SocialIcon({ id, className }: { id: (typeof BESEKA_SOCIAL_LINKS)[number]["id"]; className?: string }) {
  switch (id) {
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
          <path d="M13.5 8.5V6.7c0-.8.6-1 1-1h1.7V3h-2.3C11.8 3 11 4.8 11 6.4v2.1H9v2.7h2v7.9h2.5v-7.9H16l.4-2.7h-2.9z" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
          <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7zm5 3.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5zm0 2A1.5 1.5 0 1 0 13.5 12 1.5 1.5 0 0 0 12 10.5zM17.5 7a1 1 0 1 1-1 1 1 1 0 0 1 1-1z" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
          <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C17.8 5 12 5 12 5s-5.8 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C6.2 19 12 19 12 19s5.8 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15.5v-7l6 3.5-6 3.5z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
          <path d="M6.5 8.5h2.8V19H6.5V8.5zM7.9 4a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2zM11.2 8.5H14v1.4h.1c.4-.7 1.4-1.5 2.9-1.5 3.1 0 3.7 2 3.7 4.6V19H18v-6.4c0-1.5 0-3.5-2.1-3.5-2.1 0-2.4 1.7-2.4 3.4V19h-2.8V8.5z" />
        </svg>
      );
  }
}

type SocialFollowLinksProps = {
  className?: string;
  iconClassName?: string;
  showLabel?: boolean;
};

export function SocialFollowLinks({
  className = "",
  iconClassName = "h-4 w-4",
  showLabel = true,
}: SocialFollowLinksProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {showLabel ? (
        <span className="whitespace-nowrap text-xs font-medium text-white/90">Bizi Takip Edin:</span>
      ) : null}
      <div className="flex items-center gap-1.5">
        {BESEKA_SOCIAL_LINKS.map((link) => (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/90 transition hover:bg-white/10 hover:text-white"
          >
            <SocialIcon id={link.id} className={iconClassName} />
          </a>
        ))}
      </div>
    </div>
  );
}
