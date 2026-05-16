import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS } from "@/lib/navigation";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

interface FooterSectionProps {
  title?: string;
  className?: string;
  children: ReactNode;
}

export function FooterSection({ title, className, children }: FooterSectionProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {title && (
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
      )}
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

interface FooterLinkProps {
  href?: string;
  to?: string;
  external?: boolean;
  className?: string;
  children: ReactNode;
}

export function FooterLink({ href, to, external, className, children }: FooterLinkProps) {
  const base = cn(
    "text-sm text-muted-foreground transition-colors hover:text-foreground w-fit",
    className,
  );

  if (to) {
    return (
      <Link to={to} className={base}>
        {children}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={base}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

interface FooterIconButtonProps {
  href: string;
  label: string;
  icon: ReactNode;
  external?: boolean;
  className?: string;
}

export function FooterIconButton({
  href,
  label,
  icon,
  external = true,
  className,
}: FooterIconButtonProps) {
  return (
    <a
      href={href}
      aria-label={label}
      className={cn(
        "flex w-full min-w-0 items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5",
        "text-xs text-muted-foreground transition-colors",
        "hover:border-border/80 hover:bg-muted hover:text-foreground",
        className,
      )}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center">{icon}</span>
      <span className="hidden sm:inline truncate">{label}</span>
    </a>
  );
}

// ---------------------------------------------------------------------------
// Discord SVG
// ---------------------------------------------------------------------------

function DiscordIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-3 -3 22 22" className="h-4 w-4">
      <path
        fill="#5865F2"
        fillRule="evenodd"
        d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"
      />
    </svg>
  );
}

function RedditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path fill="#FF4500" d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path fill="url(#ig-footer-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
      <defs>
        <linearGradient id="ig-footer-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f09433"/>
          <stop offset="25%" stopColor="#e6683c"/>
          <stop offset="50%" stopColor="#dc2743"/>
          <stop offset="75%" stopColor="#cc2366"/>
          <stop offset="100%" stopColor="#bc1888"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Root footer
// ---------------------------------------------------------------------------

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card">
      <div className="px-6 py-5">
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-6">

          {/* Brand */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold tracking-wide text-primary">Iron Foundry</span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              An OSRS clan focused on community, competition, and growth.
            </p>
          </div>

          {/* Navigate — one column per section */}
          <div className="flex flex-col gap-2 sm:col-span-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Navigate</span>
            <div className="grid grid-cols-3 gap-x-4 gap-y-4">
              {NAV_SECTIONS.map((section) => (
                <div key={section.tab} className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-muted-foreground/60">{section.label}</span>
                  {section.links.map((link) => (
                    <FooterLink key={link.to} to={link.to}>{link.label}</FooterLink>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Community */}
          <FooterSection title="Community">
            <FooterLink href="https://discord.gg/ironfoundry" external>Join our Discord</FooterLink>
            <FooterLink href="https://github.com/Iron-Foundry" external>GitHub</FooterLink>
            <FooterLink href="https://buymeacoffee.com/saltrs" external>Support Server Costs</FooterLink>
          </FooterSection>

          {/* Social buttons */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Follow</span>
            <div className="grid grid-cols-2 gap-2">
              <FooterIconButton href="https://discord.gg/ironfoundry" label="Discord" icon={<DiscordIcon />} />
              <FooterIconButton href="https://github.com/Iron-Foundry" label="GitHub" icon={<GitHubIcon />} />
              <FooterIconButton href="https://www.reddit.com/r/IronFoundryOSRS/" label="Reddit" icon={<RedditIcon />} />
              <FooterIconButton href="https://www.instagram.com/ironfoundryosrs/" label="Instagram" icon={<InstagramIcon />} />
            </div>
          </div>

        </div>

        <div className="mt-5 border-t border-border pt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Iron Foundry. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">Not affiliated with Jagex Ltd.</p>
        </div>
      </div>
    </footer>
  );
}
