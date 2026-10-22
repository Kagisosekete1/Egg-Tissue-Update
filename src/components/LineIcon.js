import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const paths = {
  home: <><Path d="M3 10.8 12 3l9 7.8"/><Path d="M5.5 9.5V21h13V9.5M9 21v-7h6v7"/></>,
  shop: <><Path d="M4 8h16l-1.2 13H5.2L4 8Z"/><Path d="M8 8a4 4 0 0 1 8 0M9 12v1m6-1v1"/></>,
  rankings: <><Path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/><Path d="M8 6H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4M12 12v5m-4 4h8m-7-4h6"/></>,
  notifications: <><Path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><Path d="M10 21h4"/></>,
  settings: <><Path d="m19.4 15 .08.08 1.36 1.05-1.5 2.6-1.63-.62a8.2 8.2 0 0 1-1.55.9l-.3 1.72h-3l-.3-1.72a8.2 8.2 0 0 1-1.55-.9l-1.63.62-1.5-2.6 1.36-1.05a7.4 7.4 0 0 1 0-1.8l-1.36-1.05 1.5-2.6 1.63.62a8.2 8.2 0 0 1 1.55-.9l.3-1.72h3l.3 1.72a8.2 8.2 0 0 1 1.55.9l1.63-.62 1.5 2.6-1.36 1.05a7.4 7.4 0 0 1 0 1.8Z"/><Circle cx="12" cy="12" r="3.75"/></>,
};

/** @param {{name:string,size?:number,color?:import('react-native').ColorValue}} props */
export default function LineIcon({ name, size = 24, color = '#ffffff' }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" accessibilityElementsHidden>
    {paths[name] || <Rect x="4" y="4" width="16" height="16" rx="4"/>}
  </Svg>;
}
