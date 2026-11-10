import React from 'react';
export function View({children,style,accessibilityLabel,accessible,...rest}) { return <div style={style} aria-label={accessibilityLabel} role={accessible?'img':undefined} {...rest}>{children}</div>; }
export const AccessibilityInfo={
 isReduceMotionEnabled:()=>Promise.resolve(matchMedia('(prefers-reduced-motion: reduce)').matches),
 addEventListener:(_event,fn)=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const cb=e=>fn(e.matches);media.addEventListener('change',cb);return {remove:()=>media.removeEventListener('change',cb)};}
};
export const AppState={addEventListener:(_event,fn)=>{const cb=()=>fn(document.hidden?'background':'active');document.addEventListener('visibilitychange',cb);return {remove:()=>document.removeEventListener('visibilitychange',cb)};}};
