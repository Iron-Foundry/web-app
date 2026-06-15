export interface MeshData {
  positions: ArrayLike<number>;
  indices: ArrayLike<number>;
  normals: ArrayLike<number>;
  colors?: ArrayLike<number>;
  metadata?: Record<string, unknown>;
}

export interface SceneConfig {
  schemaVersion: number;
  durationMs: number;
  loop: boolean;
  fps: number;
  smoothing: boolean;
  initialSnapshot: SceneSnapshot;
  tracks: AnimationTrack[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnimationTrack = Record<string, any>;

export interface SceneSnapshot {
  schemaVersion: number;
  capturedAt: number;
  parts: SceneParts;
}

export interface SceneParts {
  mesh: MeshPartConfig;
  surface: SurfaceConfig;
  texture: { enabled: boolean };
  emissive: { emissiveColor: string; emissiveIntensity: number };
  coatSheen: CoatSheenConfig;
  world: WorldConfig;
  gridAxes: GridAxesConfig;
  camera: CameraConfig;
  motion: MotionConfig;
  quality: QualityConfig;
  bloom: BloomConfig;
  outline: OutlineConfig;
  postFx: PostFxConfig;
  stress: StressConfig;
  environment: EnvironmentConfig;
  hemisphere: HemisphereConfig;
  ambient: { ambientIntensity: number };
  keyLight: KeyLightConfig;
  fillLight: FillLightConfig;
  rimLight: RimLightConfig;
  topLight: { intensity: number; color: string };
  bottomLight: { intensity: number; color: string };
  roomBox: RoomBoxConfig;
  display: DisplayConfig;
}

export interface MeshPartConfig {
  smoothingRounds: number;
  cornerAngleDegrees: number;
  scale: number;
  normalize: boolean;
  vertexColor: string;
  taubinLambda: number;
  taubinMu: number;
}

export interface SurfaceConfig {
  tint: string;
  opacity: number;
  metalness: number;
  roughness: number;
  flatShading: boolean;
}

export interface CoatSheenConfig {
  clearcoat: number;
  clearcoatRoughness: number;
  ior: number;
  sheen: number;
  sheenColor: string;
  anisotropy: number;
}

export interface WorldConfig {
  backgroundColor: string;
  toneMapping: string;
  exposure: number;
}

export interface GridAxesConfig {
  gridColor: string;
  gridSize: number;
  gridDivisions: number;
  gridFloorY: number;
  axesLength: number;
}

export interface CameraConfig {
  fov: number;
  near: number;
  far: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  dampingFactor: number;
  fitDistanceMultiplier: number;
  frontDistanceMultiplier: number;
}

export interface MotionConfig {
  breatheEnabled: boolean;
  breatheAmplitude: number;
  breathePeriodMs: number;
  bobEnabled: boolean;
  bobAmplitude: number;
  bobPeriodMs: number;
  tiltEnabled: boolean;
  tiltStrength: number;
  rotateSpeed: number;
}

export interface QualityConfig {
  fxaaEnabled: boolean;
  msaaSamples: number;
  supersample: number;
}

export interface BloomConfig {
  bloomEnabled: boolean;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
}

export interface OutlineConfig {
  outlineEnabled: boolean;
  outlineColor: string;
  outlineThickness: number;
}

export interface PostFxConfig {
  vignetteEnabled: boolean;
  vignetteAmount: number;
  vignetteColor: string;
  chromaticAberrationEnabled: boolean;
  chromaticAberrationAmount: number;
  contrastEnabled: boolean;
  contrastAmount: number;
}

export interface StressConfig {
  enabled: boolean;
  radius: number;
  lerp: number;
  glowColor: string;
}

export interface EnvironmentConfig {
  enabled: boolean;
  intensity: number;
  hdrName: string | null;
}

export interface HemisphereConfig {
  skyColor: string;
  groundColor: string;
  intensity: number;
}

export interface KeyLightConfig {
  keyIntensity: number;
  keyPositionX: number;
  keyPositionY: number;
  keyPositionZ: number;
  shadowBias: number;
  shadowRadius: number;
}

export interface FillLightConfig {
  fillIntensity: number;
  fillColor: string;
  fillPositionX: number;
  fillPositionY: number;
  fillPositionZ: number;
}

export interface RimLightConfig {
  intensity: number;
  color: string;
  positionX: number;
  positionY: number;
  positionZ: number;
}

export interface RoomBoxConfig {
  enabled: boolean;
  color: string;
  roughness: number;
  metalness: number;
  size: number;
  floorOnly: boolean;
  floorY: number;
}

export interface DisplayConfig {
  material: string;
  smoothShading: boolean;
  wireframe: boolean;
  wireframeColor: string;
  wireframeOpacity: number;
  autoRotate: boolean;
  showGrid: boolean;
  castShadows: boolean;
}
