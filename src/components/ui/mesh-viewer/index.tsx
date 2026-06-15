import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { MeshRenderer } from "./renderer";
import type { MeshData, SceneConfig } from "./types";

export type { MeshData, SceneConfig } from "./types";

interface MeshViewerProps {
  /** Parsed scene config JSON (schemaVersion 5). */
  scene: SceneConfig;
  /** Parsed mesh data file containing positions, indices, normals, colors. */
  mesh: MeshData;
  className?: string;
}

/**
 * Renders a 3D mesh inline using WebGL (Three.js).
 * Size is controlled entirely by className / parent layout.
 * The canvas fills its container via w-full h-full.
 *
 * Usage:
 *   <MeshViewer scene={sceneJson} mesh={meshData} className="w-32 h-32" />
 */
export function MeshViewer({ scene, mesh, className }: MeshViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<MeshRenderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement ?? canvas;
    const w = Math.max(parent.clientWidth, 1);
    const h = Math.max(parent.clientHeight, 1);

    const renderer = new MeshRenderer(canvas, scene, w, h);
    renderer.loadMesh(mesh);
    renderer.start();
    rendererRef.current = renderer;

    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) renderer.resize(rect.width, rect.height);
    });
    ro.observe(parent);

    return () => {
      ro.disconnect();
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [scene, mesh]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", width: "100%", height: "100%" }}
      className={cn(className)}
    />
  );
}
