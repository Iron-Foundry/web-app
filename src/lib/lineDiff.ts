export type DiffLine = { kind: "same" | "old" | "new"; text: string };

function lcsTable(a: string[], b: string[]): number[][] {
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i]![j] = a[i] === b[j] ? table[i + 1]![j + 1]! + 1 : Math.max(table[i + 1]![j]!, table[i]![j + 1]!);
    }
  }
  return table;
}

/** Both sides of a line diff: "old" lines exist only in `before`, "new" lines only in `after`. */
export function diffLines(before: string[], after: string[]): DiffLine[] {
  const table = lcsTable(before, after);
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < before.length && j < after.length) {
    if (before[i] === after[j]) {
      out.push({ kind: "same", text: before[i]! });
      i++;
      j++;
    } else if (table[i + 1]![j]! >= table[i]![j + 1]!) {
      out.push({ kind: "old", text: before[i++]! });
    } else {
      out.push({ kind: "new", text: after[j++]! });
    }
  }
  while (i < before.length) out.push({ kind: "old", text: before[i++]! });
  while (j < after.length) out.push({ kind: "new", text: after[j++]! });
  return out;
}
