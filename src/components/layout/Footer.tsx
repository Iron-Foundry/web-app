import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS } from "@/lib/navigation";

import { DiscordIcon, GitHubIcon, InstagramIcon, RedditIcon } from "./FooterIcons";

interface FooterSectionProps {
  title?: string;
  className?: string;
  children: ReactNode;
}

function FooterSection({ title, className, children }: FooterSectionProps) {
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

function FooterLink({ href, to, external, className, children }: FooterLinkProps) {
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

function FooterIconButton({
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
      title={label}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-lg border border-border",
        "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {icon}
    </a>
  );
}

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-8 gap-y-6 px-4 py-6 md:grid-cols-6 md:px-8">
        <div className="col-span-2 flex flex-col gap-2 md:col-span-1">
          <span className="text-sm font-semibold text-foreground">Iron Foundry</span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            An OSRS clan focused on community, competition, and growth.
          </p>
        </div>

        {NAV_SECTIONS.map((section) => (
          <FooterSection key={section.tab} title={section.label}>
            {section.links.map((link) => (
              <FooterLink key={link.to} to={link.to}>{link.label}</FooterLink>
            ))}
          </FooterSection>
        ))}

        <FooterSection title="Links">
          <FooterLink href="https://discord.gg/ironfoundry" external>Join our Discord</FooterLink>
          <FooterLink href="https://github.com/Iron-Foundry" external>GitHub</FooterLink>
          <FooterLink href="https://buymeacoffee.com/saltrs" external>Support Server Costs</FooterLink>
        </FooterSection>

        <FooterSection title="Follow">
          <div className="grid w-fit grid-cols-2 gap-2">
            <FooterIconButton href="https://discord.gg/ironfoundry" label="Discord" icon={<DiscordIcon />} />
            <FooterIconButton href="https://github.com/Iron-Foundry" label="GitHub" icon={<GitHubIcon />} />
            <FooterIconButton href="https://www.reddit.com/r/IronFoundryOSRS/" label="Reddit" icon={<RedditIcon />} />
            <FooterIconButton href="https://www.instagram.com/ironfoundryosrs/" label="Instagram" icon={<InstagramIcon />} />
          </div>
        </FooterSection>

        <div className="col-span-full flex flex-col gap-1 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Iron Foundry. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">Not affiliated with Jagex Ltd.</p>
        </div>
      </div>
    </footer>
  );
}
