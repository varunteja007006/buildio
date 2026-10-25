import type { RefObject } from "react";
import type * as THREE from "three";

export type AgentState = null | "thinking" | "listening" | "talking";

export type OrbProps = {
  colors?: [string, string];
  colorsRef?: RefObject<[string, string]>;
  resizeDebounce?: number;
  seed?: number;
  agentState?: AgentState;
  volumeMode?: "auto" | "manual";
  manualInput?: number;
  manualOutput?: number;
  inputVolumeRef?: RefObject<number>;
  outputVolumeRef?: RefObject<number>;
  getInputVolume?: () => number;
  getOutputVolume?: () => number;
  className?: string;
};

/**
 * Typed shape of the orb's shader uniforms. `ShaderMaterial.uniforms` is an
 * index-signature map, so this type is used to cast back a concrete shape for
 * frame updates under `noUncheckedIndexedAccess`.
 */
export type OrbUniforms = {
  uColor1: THREE.IUniform<THREE.Color>;
  uColor2: THREE.IUniform<THREE.Color>;
  uOffsets: THREE.IUniform<Float32Array>;
  uPerlinTexture: THREE.IUniform<THREE.Texture>;
  uTime: THREE.IUniform<number>;
  uAnimation: THREE.IUniform<number>;
  uInverted: THREE.IUniform<number>;
  uInputVolume: THREE.IUniform<number>;
  uOutputVolume: THREE.IUniform<number>;
  uOpacity: THREE.IUniform<number>;
};
