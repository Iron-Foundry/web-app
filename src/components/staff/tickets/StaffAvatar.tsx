import { cn } from "@/lib/utils";

interface StaffAvatarProps {
  name: string;
  avatarUrl: string | null;
  size?: "sm" | "md";
  className?: string;
}

export function StaffAvatar({ name, avatarUrl, size = "sm", className }: StaffAvatarProps) {
  const dim = size === "sm" ? "h-5 w-5" : "h-7 w-7";
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className={cn(dim, "shrink-0 rounded-full object-cover")}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <span
          className={cn(dim, "shrink-0 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground")}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="text-sm font-medium text-foreground truncate">{name}</span>
    </span>
  );
}
