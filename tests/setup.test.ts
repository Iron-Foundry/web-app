import { expect, test } from "bun:test";

test("happy-dom globals are registered", () => {
  const el = document.createElement("div");
  el.textContent = "foundry";
  document.body.appendChild(el);
  expect(document.body.querySelector("div")?.textContent).toBe("foundry");
});
