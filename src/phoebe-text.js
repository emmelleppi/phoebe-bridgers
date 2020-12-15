import React, { useRef, useMemo, createRef } from "react";
import { useFrame } from "react-three-fiber";
import { Text } from "@react-three/drei";
import {
  easeInOutCubic,
  lerp,
  betaRef,
  gammaRef,
  useStore,
  isMobile,
  FONT_PROPS,
} from "./utils";

export default function PhoebeText() {
  const time = useRef(0);
  const TIME = 200;
  const clicked = useStore((s) => s.clicked);

  const charsarray = useMemo(() =>
    "PHOEBExBRIDGERS".split("").map((char) => ({
      char,
      ref: createRef(),
    }))
  );

  useFrame(() => {
    if (clicked) {
      if (time.current < TIME) {
        time.current += 1;
      }
    } else {
      if (time.current > 0) {
        time.current -= 1;
      }
    }
    charsarray.forEach(({ ref }, index) => {
      ref.current.position.z = lerp(
        0.1,
        -0.1,
        easeInOutCubic(time.current / TIME)
      );
      ref.current.rotation.y = (-gammaRef.current / 100) * (isMobile ? 1 : -1);
      ref.current.rotation.x = (betaRef.current / 200) * (isMobile ? 1 : -1);
    });
  });

  return charsarray.map(({ char, ref }, index) => (
    <Text
      ref={ref}
      key={`0${index}${char}`}
      position={[
        0.1 * ((index % 3) - 1),
        0.15 * (2 - Math.floor(index / 3)),
        0.1,
      ]}
      fontSize={char === "x" ? 0.05 : 0.13}
      {...FONT_PROPS}
    >
      {char}
    </Text>
  ));
}
