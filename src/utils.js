import { createRef } from "react";
import create from "zustand";

const CUSTOM_PALETTE = [
  {
    r: 0,
    g: 0,
    b: 0,
  },
  {
    r: 0x0,
    g: 0x40,
    b: 0xff,
  },
  {
    r: 255,
    g: 255,
    b: 255,
  },
];
export const FONT_PROPS = {
  color: "white",
  maxWidth: 0.6,
  "material-toneMapped": false,
  "material-fog": false,
  textAlign: "center",
  font:
    "https://fonts.gstatic.com/s/cinzel/v10/8vIU7ww63mVu7gtR-kwKxNvkNOjw-tbnfY3lCw.woff",
};

export function mapColorToPalette(red, green, blue) {
  let color, diffR, diffG, diffB, diffDistance;
  let mappedColor = { r: 0, g: 0, b: 0 };
  let distance = 18000;
  for (let i = 0; i < CUSTOM_PALETTE.length; i++) {
    color = CUSTOM_PALETTE[i];
    diffR = color.r - red;
    diffG = color.g - green;
    diffB = color.b - blue;
    diffDistance = diffR * diffR + diffG * diffG + diffB * diffB;
    if (diffDistance < distance) {
      distance = diffDistance;
      mappedColor = CUSTOM_PALETTE[i];
    }
  }
  return mappedColor;
}

export function easeInOutCubic(x) {
  if (x > 1) return 1;
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
export function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end;
}

export const betaRef = createRef(0);
export const gammaRef = createRef(0);
export const rotation = createRef();
export const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export const [useStore] = create((set) => ({
  clicked: false,
  toggleClick: () => set((state) => ({ clicked: !state.clicked })),
}));
