import React, {
  useRef,
  useMemo,
  useState,
  Suspense,
  useCallback,
  useEffect,
} from "react";
import ReactDOM from "react-dom";
import * as THREE from "three";
import {
  Canvas,
  createPortal,
  useFrame,
  useLoader,
  useThree,
} from "react-three-fiber";
import { Plane, Box, Text, Loader, useTexture } from "@react-three/drei";
import clamp from "lodash.clamp";
import { DeviceOrientationControls } from "three/examples/jsm/controls/DeviceOrientationControls";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import {
  betaRef,
  gammaRef,
  useStore,
  isMobile,
  rotation,
  FONT_PROPS,
} from "./utils";
import _Pixeloni from "./pixel";
import Mouse from "./mouse";
import PhoebeText from "./phoebe-text";
import "./styles.css";
import usePostprocessing from "./use-postprocessing";

function Boxes({ width, height }) {
  const texture = useTexture("/norm.jpg");
  const normal = useMemo(() => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat = new THREE.Vector2(4, 4);
    return texture;
  }, [texture]);

  const materialProps = {
    normalScale: [1, 1],
    normalMap: normal,
    roughness: 0.1,
    metalness: 0.98,
    side: THREE.BackSide,
    color: "#555",
    envMapIntensity: 0.8,
  };

  return (
    <group>
      <Box args={[width, height, 0.8]}>
        <meshStandardMaterial {...materialProps} attachArray="material" />
        <meshStandardMaterial {...materialProps} attachArray="material" />
        <meshStandardMaterial {...materialProps} attachArray="material" />
        <meshStandardMaterial {...materialProps} attachArray="material" />
        <meshStandardMaterial
          transparent
          opacity={0}
          side={THREE.BackSide}
          attachArray="material"
        />
        <meshStandardMaterial {...materialProps} attachArray="material" />
      </Box>
      <_Pixeloni url="./phoebe.png" />
      <PhoebeText />
    </group>
  );
}

function DepthCube({ width, height }) {
  return (
    <group>
      <Suspense fallback={null}>
        <Boxes width={width} height={height} />
      </Suspense>
      {!isMobile && <Mouse width={width} height={height} />}
    </group>
  );
}

function PlanePortal({ width, height }) {
  const planeRef = useRef();
  const toggleClick = useStore((s) => s.toggleClick);
  const [camera] = useState(() => new THREE.PerspectiveCamera());
  const { gl } = useThree();

  const {
    near,
    scene,
    target,
    portalHalfWidth,
    portalHalfHeight,
  } = useMemo(() => {
    const target = new THREE.WebGLMultisampleRenderTarget(1024, 1024);
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 0, 1.75);
    scene.background = new THREE.Color(0x000000);
    const near = 0.1;
    const portalHalfWidth = width / 2;
    const portalHalfHeight = height / 2;
    return { near, scene, target, portalHalfWidth, portalHalfHeight };
  }, [width, height]);

  usePostprocessing(scene, camera)

  const result = useLoader(RGBELoader, "/studio_small_02_1k.hdr");
  useEffect(() => {
    const gen = new THREE.PMREMGenerator(gl);
    const texture = gen.fromEquirectangular(result).texture;
    scene.environment = texture;
    result.dispose();
    gen.dispose();
    return () => {
      scene.environment = scene.background = null;
    };
  }, [gl, result, scene]);

  useFrame((state) => {
    camera.position.copy(state.camera.position);
    camera.quaternion.copy(planeRef.current.quaternion);
    const portalPosition = new THREE.Vector3().copy(planeRef.current.position);
    camera.updateMatrixWorld();
    camera.worldToLocal(portalPosition);
    const left = portalPosition.x - portalHalfWidth;
    const right = portalPosition.x + portalHalfWidth;
    const top = portalPosition.y + portalHalfHeight;
    const bottom = portalPosition.y - portalHalfHeight;
    const distance = Math.abs(portalPosition.z);
    const scale = near / distance;
    const scaledLeft = left * scale;
    const scaledRight = right * scale;
    const scaledTop = top * scale;
    const scaledBottom = bottom * scale;
    camera.projectionMatrix.makePerspective(
      scaledLeft,
      scaledRight,
      scaledTop,
      scaledBottom,
      near,
      100
    );
    //state.gl.render(scene, camera);
  }, 1);
  return (
    <>
      {createPortal(<DepthCube width={width} height={height} />, scene)}
      <Plane ref={planeRef} onClick={toggleClick}>
        <meshStandardMaterial attach="material" map={target.texture} />
      </Plane>
    </>
  );
}

function InteractionManager() {
  const { aspect } = useThree();
  const { width, height } = useMemo(
    () =>
      aspect > 1
        ? {
            width: 1,
            height: 1 / aspect,
          }
        : {
            width: aspect,
            height: 1,
          },

    [aspect]
  );
  const [clicked, setClicked] = useState(false);
  const handleClick = useCallback(
    function handleClick() {
      setClicked(true);
      rotation.current = new DeviceOrientationControls(
        new THREE.PerspectiveCamera()
      );
    },
    [setClicked]
  );
  useFrame(({ camera }) => {
    if (!rotation.current) return;
    rotation.current.update();
    if (!rotation.current?.deviceOrientation) return;
    const { beta, gamma } = rotation.current.deviceOrientation;
    if (!beta || !gamma) return;
    betaRef.current = clamp(beta, -45 * height, 45 * height);
    gammaRef.current = clamp(gamma, -45 * width, 45 * width);
    camera.lookAt(0, 0, 0);
    camera.position.x = -gammaRef.current / 90;
    camera.position.y = -betaRef.current / 90;
    camera.position.z =
      1 -
      0.5 *
        Math.min(Math.abs(camera.position.x) + Math.abs(camera.position.y), 1);
  });
  return clicked ? (
    <PlanePortal width={width} height={height} />
  ) : (
    <Text
      onClick={handleClick}
      position={[0, 0, -0.1]}
      rotation-z={Math.PI / 16}
      fontSize={0.2}
      {...FONT_PROPS}
    >
      CLICK
    </Text>
  );
}

function App() {
  return (
    <>
      <Canvas
        concurrent
        camera={{ position: [0, 0, 1], far: 100, near: 0.1 }}
        pixelRatio={[1, 2]}
        gl={{
          powerPreference: "high-performance",
        }}
      >
        <color attach="background" args={["black"]} />
        <Suspense fallback={null}>
          <InteractionManager />
        </Suspense>
      </Canvas>
      <Loader />
    </>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
