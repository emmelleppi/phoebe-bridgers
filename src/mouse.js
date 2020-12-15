import * as THREE from "three";
import { useFrame, useThree } from "react-three-fiber";
import clamp from "lodash.clamp";
import { betaRef, gammaRef } from "./utils";

export default function Mouse({ width, height }) {
  const { viewport } = useThree();
  const vec = new THREE.Vector3();
  return useFrame((state) => {
    betaRef.current = -clamp(
      state.mouse.y * viewport.height * 200,
      -45 * height,
      45 * height
    );
    gammaRef.current = -clamp(
      state.mouse.x * viewport.width * 200,
      -45 * width,
      45 * width
    );
    state.camera.lookAt(0, 0, 0);
    state.camera.position.lerp(
      vec.set(
        gammaRef.current / 120,
        betaRef.current / 120,
        1 -
          0.5 *
            Math.min(
              Math.abs(state.camera.position.x) +
                Math.abs(state.camera.position.y),
              1
            )
      ),
      0.1
    );
  });
}
