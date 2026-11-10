// Supports the original host and GitHub Pages project subdirectories.
export const APP_BASE=new URL('.',document.baseURI).pathname;
export const appPath=path=>APP_BASE+path.replace(/^\//,'');
