import { useEffect, useState } from "react";
import { osrsCacheApi } from "@/api/osrsCache";
import type { OsrsSpriteCategory } from "@/types/osrsCache";

function humanize(category: string): string {
  return category.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
}

interface SpriteCategoryPickerProps {
  value: string | null;
  onChange: (category: string | null) => void;
}

export function SpriteCategoryPicker({
  value,
  onChange,
}: SpriteCategoryPickerProps): React.JSX.Element {
  const [categories, setCategories] = useState<OsrsSpriteCategory[]>([]);

  useEffect(() => {
    osrsCacheApi
      .listSpriteCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="h-8 text-sm rounded-md border border-border bg-background px-2 max-w-64"
    >
      <option value="">All categories</option>
      {categories.map((c) => (
        <option key={c.category} value={c.category}>
          {humanize(c.category)} ({c.count})
        </option>
      ))}
    </select>
  );
}
