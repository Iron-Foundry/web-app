declare module "*.apng" {
  const src: string;
  export default src;
}

declare module "*.css" {
  const content: string;
  export default content;
}

declare module "*.toml" {
  const content: Record<string, unknown>;
  export default content;
}

declare module "*.json" {
  const content: unknown;
  export default content;
}
