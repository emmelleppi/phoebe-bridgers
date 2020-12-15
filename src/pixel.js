import React, { useMemo, useRef } from "react";
import { extend, useFrame } from "react-three-fiber";
import * as THREE from "three";
import { RoundedBoxBufferGeometry } from "three/examples/jsm/geometries/RoundedBoxBufferGeometry";
import usePixels, { WIDTH, HEIGHT } from "./use-pixels";
import { easeInOutCubic, lerp, betaRef, gammaRef, useStore } from "./utils";

extend({ RoundedBoxBufferGeometry });
const _object = new THREE.Object3D();
const TIME = 50;
const SCALE = 0.0025;

function Pixeloni(props) {
  const { colors, alpha, columns, rows } = props;
  const group = useRef();
  const ref = useRef();
  const attrib = useRef();
  const time = useRef(0);

  const clicked = useStore((s) => s.clicked);

  const [timeArray] = useMemo(() => {
    const array = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        array.push(TIME + Math.floor(Math.random() * rows));
      }
    }
    return [array];
  });

  useFrame(({ clock }) => {
    const _time = clock.getElapsedTime();

    if (clicked) {
      if (time.current < TIME + rows) {
        time.current += 1;
      }
    } else {
      if (time.current > 0) {
        time.current -= 1;
      }
    }

    if (ref.current && attrib.current) {
      let i = 0;
      const gamma = gammaRef.current;
      const beta = betaRef.current / 2;
      const sin = Math.sin(_time / 10);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          const id = i++;
          const _x = -(columns / 2) + x;
          const _y = rows / 2 - y;
          const _z = lerp(
            -50,
            80,
            easeInOutCubic(time.current / timeArray[id])
          );
          const cosxPos = 2 * Math.cos(_time + _x / 20);
          const cosyPos = 2 * Math.cos(_time + _y / 20);
          const cosyRot = Math.cos(_time + _y / 10);
          const sinxRot = Math.sin(_time + _x / 10);

          _object.position.set(
            _x + gamma * cosyPos * sin,
            _y + beta * cosxPos * sin,
            _z
          );
          group.current.rotation.set(
            0.01 * gamma * cosyRot,
            0.01 * beta * sinxRot,
            0.01 * (beta * cosyRot + gamma * sinxRot)
          );

          _object.updateMatrix();
          attrib.current.needsUpdate = true;

          if (alpha[id] > 0.9) {
            ref.current.setMatrixAt(id, _object.matrix);
          }
        }
      }
      ref.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={group}>
      <instancedMesh
        castShadow
        ref={ref}
        args={[null, null, colors.length / 3]}
        scale={[SCALE, SCALE, SCALE]}
      >
        <roundedBoxBufferGeometry args={[1, 1, 1, 1, 0]}>
          <instancedBufferAttribute
            ref={attrib}
            attachObject={["attributes", "color"]}
            args={[colors, 3]}
          />
        </roundedBoxBufferGeometry>
        <meshStandardMaterial
          metalness={1}
          roughness={0.3}
          vertexColors={THREE.VertexColors}
          fog={false}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}

function _Pixeloni({ url, ...props }) {
  const imageProps = usePixels(url);
  return (
    imageProps.colors.length > 0 && <Pixeloni {...imageProps} {...props} />
  );
}

export default _Pixeloni;
