import * as THREE from "three";
import type { MeshData, SceneConfig, SceneParts } from "./types";

const TONE_MAPPING_MAP: Record<string, THREE.ToneMapping> = {
  none: THREE.NoToneMapping,
  linear: THREE.LinearToneMapping,
  reinhard: THREE.ReinhardToneMapping,
  cineon: THREE.CineonToneMapping,
  aces: THREE.ACESFilmicToneMapping,
};

export class MeshRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private meshGroup: THREE.Group;
  private animFrameId: number | null = null;
  private startTime = performance.now();
  private config: SceneConfig;

  constructor(
    canvas: HTMLCanvasElement,
    config: SceneConfig,
    width: number,
    height: number,
  ) {
    this.config = config;
    const parts = config.initialSnapshot.parts;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: parts.quality.msaaSamples > 1,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio * (parts.quality.supersample || 1), 2),
    );
    this.renderer.setSize(width, height, false);

    const toneMapping =
      TONE_MAPPING_MAP[parts.world.toneMapping] ?? THREE.NoToneMapping;
    this.renderer.toneMapping = toneMapping;
    this.renderer.toneMappingExposure = parts.world.exposure;

    if (parts.display.castShadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(parts.world.backgroundColor);

    const cam = parts.camera;
    this.camera = new THREE.PerspectiveCamera(cam.fov, width / height, cam.near, cam.far);
    this.camera.position.set(cam.positionX, cam.positionY, cam.positionZ);
    this.camera.lookAt(cam.targetX, cam.targetY, cam.targetZ);

    this.meshGroup = new THREE.Group();
    this.scene.add(this.meshGroup);

    this.buildLights(parts);
  }

  private buildLights(parts: SceneParts) {
    const ambient = new THREE.AmbientLight(0xffffff, parts.ambient.ambientIntensity);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(
      new THREE.Color(parts.hemisphere.skyColor),
      new THREE.Color(parts.hemisphere.groundColor),
      parts.hemisphere.intensity,
    );
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, parts.keyLight.keyIntensity);
    key.position.set(
      parts.keyLight.keyPositionX,
      parts.keyLight.keyPositionY,
      parts.keyLight.keyPositionZ,
    );
    if (parts.display.castShadows) {
      key.castShadow = true;
      key.shadow.bias = parts.keyLight.shadowBias;
      key.shadow.radius = parts.keyLight.shadowRadius;
    }
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(
      new THREE.Color(parts.fillLight.fillColor),
      parts.fillLight.fillIntensity,
    );
    fill.position.set(
      parts.fillLight.fillPositionX,
      parts.fillLight.fillPositionY,
      parts.fillLight.fillPositionZ,
    );
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(
      new THREE.Color(parts.rimLight.color),
      parts.rimLight.intensity,
    );
    rim.position.set(
      parts.rimLight.positionX,
      parts.rimLight.positionY,
      parts.rimLight.positionZ,
    );
    this.scene.add(rim);

    const top = new THREE.DirectionalLight(
      new THREE.Color(parts.topLight.color),
      parts.topLight.intensity,
    );
    top.position.set(0, 5, 0);
    this.scene.add(top);

    const bottom = new THREE.DirectionalLight(
      new THREE.Color(parts.bottomLight.color),
      parts.bottomLight.intensity,
    );
    bottom.position.set(0, -5, 0);
    this.scene.add(bottom);
  }

  loadMesh(data: MeshData) {
    for (const child of [...this.meshGroup.children]) {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
      this.meshGroup.remove(child);
    }

    const parts = this.config.initialSnapshot.parts;
    const geo = new THREE.BufferGeometry();

    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(toFloat32(data.positions), 3),
    );
    geo.setAttribute(
      "normal",
      new THREE.BufferAttribute(toFloat32(data.normals), 3),
    );
    if (data.colors) {
      geo.setAttribute(
        "color",
        new THREE.BufferAttribute(toFloat32(data.colors), 3),
      );
    }
    geo.setIndex(new THREE.BufferAttribute(toUint32(data.indices), 1));

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(parts.surface.tint),
      metalness: parts.surface.metalness,
      roughness: parts.surface.roughness,
      flatShading: parts.surface.flatShading,
      vertexColors: !!data.colors,
      opacity: parts.surface.opacity,
      transparent: parts.surface.opacity < 1,
      wireframe: parts.display.wireframe,
    });

    if (parts.emissive.emissiveIntensity > 0) {
      mat.emissive = new THREE.Color(parts.emissive.emissiveColor);
      mat.emissiveIntensity = parts.emissive.emissiveIntensity;
    }

    const mesh = new THREE.Mesh(geo, mat);
    if (parts.display.castShadows) {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
    this.meshGroup.add(mesh);
  }

  start() {
    this.startTime = performance.now();
    const tick = () => {
      this.animFrameId = requestAnimationFrame(tick);
      this.animate();
      this.renderer.render(this.scene, this.camera);
    };
    tick();
  }

  private animate() {
    const elapsed = performance.now() - this.startTime;
    const { motion, display } = this.config.initialSnapshot.parts;

    let yOffset = 0;
    let uniformScale = 1;

    if (motion.breatheEnabled) {
      const t = (elapsed % motion.breathePeriodMs) / motion.breathePeriodMs;
      uniformScale = 1 + Math.sin(t * Math.PI * 2) * motion.breatheAmplitude;
    }

    if (motion.bobEnabled) {
      const t = (elapsed % motion.bobPeriodMs) / motion.bobPeriodMs;
      yOffset = Math.sin(t * Math.PI * 2) * motion.bobAmplitude;
    }

    this.meshGroup.position.y = yOffset;
    this.meshGroup.scale.setScalar(uniformScale);

    if (display.autoRotate) {
      this.meshGroup.rotation.y += motion.rotateSpeed * 0.01;
    }
  }

  resize(width: number, height: number) {
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  dispose() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.renderer.dispose();
  }
}

function toFloat32(src: ArrayLike<number>): Float32Array {
  return src instanceof Float32Array ? src : new Float32Array(src);
}

function toUint32(src: ArrayLike<number>): Uint32Array {
  return src instanceof Uint32Array ? src : new Uint32Array(src);
}
