import type React from "react";

export const shineHandlers = {
  onMouseMove: (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - r.top}px`);
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty("--mouse-x", "-9999px");
    e.currentTarget.style.setProperty("--mouse-y", "-9999px");
  },
};
