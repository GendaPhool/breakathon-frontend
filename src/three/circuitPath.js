import * as THREE from "three";

/**
 * The branch the bug crawls along. A gently waving horizontal curve that runs
 * off-screen at both ends, so when the crawl loops the wrap happens out of view.
 * Mostly in the z~0 plane so it reads as a side-on branch.
 */
const CONTROL_POINTS = [
  [-9.5, -0.8, 0.0],
  [-6.5, 0.5, -0.3],
  [-3.5, -0.5, 0.2],
  [-0.5, 0.6, -0.2],
  [2.5, -0.4, 0.3],
  [5.5, 0.5, -0.2],
  [9.5, -0.6, 0.0],
];

export function createBranchCurve() {
  const points = CONTROL_POINTS.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  // open curve (a branch has ends), gentle tension
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
}

// Backwards-compatible alias.
export const createCircuitCurve = createBranchCurve;
