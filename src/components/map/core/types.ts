export interface OsrsCoord {
  x: number;
  y: number;
  plane?: number;
}

export interface OsrsPin {
  coord: OsrsCoord;
  label: string;
  description?: string;
  color?: string;
}

export interface OsrsTilemarker {
  coord: OsrsCoord;
  label?: string;
  description?: string;
  color?: string;
}

export interface OsrsArea {
  coords: OsrsCoord[];
  label?: string;
  fillColor?: string;
  strokeColor?: string;
}

export interface OsrsMapBaseProps {
  mapId?: number;
  zoom?: number;
  center?: OsrsCoord;
  plane?: number;
  className?: string;
  minZoom?: number;
  maxZoom?: number;
}
