/** Nearest ancestor that scrolls vertically, or null if the page scrolls. */
export function findScrollParent(node: HTMLElement | null): Element | null {
  let el = node?.parentElement ?? null;
  while (el) {
    const { overflowY } = getComputedStyle(el);
    if (overflowY === "auto" || overflowY === "scroll") return el;
    el = el.parentElement;
  }
  return null;
}
