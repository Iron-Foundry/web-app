import { describe, expect, test } from "bun:test";
import { markdownExcerpt } from "@/embed/utils";

describe("markdownExcerpt", () => {
  test("strips headings, emphasis and links to plaintext", () => {
    const body = "# Title\n\nSome **bold** and _italic_ text with a [link](https://x.cc).";
    expect(markdownExcerpt(body)).toBe("Title Some bold and italic text with a link.");
  });

  test("drops fenced and inline code blocks", () => {
    const body = "Intro `inline` then\n\n```ts\nconst x = 1;\n```\n\ntail";
    expect(markdownExcerpt(body)).toBe("Intro then tail");
  });

  test("strips list markers, blockquotes and image syntax", () => {
    const body = "> quote\n\n- one\n- two\n\n![alt](img.png) end";
    expect(markdownExcerpt(body)).toBe("quote one two end");
  });

  test("truncates with an ellipsis past the max length", () => {
    const out = markdownExcerpt("word ".repeat(60), 40);
    expect(out.length).toBe(40);
    expect(out.endsWith("…")).toBe(true);
  });

  test("returns short text unchanged", () => {
    expect(markdownExcerpt("just a line", 160)).toBe("just a line");
  });
});
