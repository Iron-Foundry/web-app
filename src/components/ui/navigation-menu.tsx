import * as React from "react";
import * as Primitive from "@radix-ui/react-navigation-menu";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof Primitive.Root>,
  React.ComponentPropsWithoutRef<typeof Primitive.Root>
>(({ className, children, ...props }, ref) => (
  <Primitive.Root
    ref={ref}
    className={cn("relative z-10 flex max-w-max flex-1 items-center justify-center", className)}
    {...props}
  >
    {children}
  </Primitive.Root>
));
NavigationMenu.displayName = Primitive.Root.displayName;

export const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof Primitive.List>,
  React.ComponentPropsWithoutRef<typeof Primitive.List>
>(({ className, ...props }, ref) => (
  <Primitive.List
    ref={ref}
    className={cn("group flex flex-1 list-none items-center gap-1", className)}
    {...props}
  />
));
NavigationMenuList.displayName = Primitive.List.displayName;

export const NavigationMenuItem = React.forwardRef<
  React.ElementRef<typeof Primitive.Item>,
  React.ComponentPropsWithoutRef<typeof Primitive.Item>
>(({ className, ...props }, ref) => (
  <Primitive.Item
    ref={ref}
    className={cn("relative", className)}
    {...props}
  />
));
NavigationMenuItem.displayName = Primitive.Item.displayName;

export const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof Primitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof Primitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <Primitive.Trigger
    ref={ref}
    className={cn(
      "group inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium",
      "text-muted-foreground transition-colors",
      "hover:bg-muted hover:text-foreground",
      "data-[state=open]:bg-muted data-[state=open]:text-foreground",
      "focus:outline-none disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronDown
      className="h-3 w-3 shrink-0 transition-transform duration-150 group-data-[state=open]:rotate-180"
      aria-hidden
    />
  </Primitive.Trigger>
));
NavigationMenuTrigger.displayName = Primitive.Trigger.displayName;

export const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof Primitive.Content>,
  React.ComponentPropsWithoutRef<typeof Primitive.Content>
>(({ className, ...props }, ref) => (
  <Primitive.Content
    ref={ref}
    className={cn(
      "absolute left-0 top-full z-50 mt-1",
      "rounded-md border border-border bg-card shadow-lg",
      "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-2",
      "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-90 data-[state=closed]:slide-out-to-top-2",
      "duration-200 origin-top-left",
      className,
    )}
    {...props}
  />
));
NavigationMenuContent.displayName = Primitive.Content.displayName;

export const NavigationMenuLink = Primitive.Link;
