const fs=require('fs'),path=require('path'),crypto=require('crypto');
fs.mkdirSync('dist',{recursive:true});fs.cpSync('public','dist',{recursive:true});
const esbuild=require('esbuild');
esbuild.buildSync({entryPoints:['src/web/main.jsx'],bundle:true,minify:true,sourcemap:false,outfile:'dist/game.js',loader:{'.js':'jsx'},external:['/fonts/*'],alias:{'react-native':require('path').resolve('src/web/native-adapter.jsx'),'react-native-svg':require('path').resolve('src/web/svg-adapter.jsx')},define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof'});

require('fs').cpSync('assets/audio','dist/audio',{recursive:true});

const music=fs.readdirSync('assets/audio/game-music').filter(file=>/\.(mp3|m4a)$/.test(file)).map(file=>'/audio/game-music/'+file);
const effects=fs.readdirSync('assets/audio').filter(file=>/\.(wav|ogg)$/.test(file)).map(file=>'/audio/'+file);
const fonts=fs.readdirSync('public/fonts').filter(file=>file.endsWith('.woff2')).map(file=>'/fonts/'+file);
const core=['/launch.js','/index.html','/game.js','/game.css','/manifest.webmanifest','/icons/icon-192.png','/icons/icon-512.png','/icons/icon-180.png','/icons/maskable-512.png',...effects,...fonts];
const template=fs.readFileSync('scripts/sw-template.js','utf8');const digest=crypto.createHash('sha256').update(template);for(const file of core)digest.update(file).update(fs.readFileSync('dist'+file));const hash=digest.digest('hex').slice(0,16);
fs.writeFileSync('dist/sw.js',template.replace('__VERSION__',hash).replace('__CORE__',JSON.stringify(core)).replace('__MUSIC__',JSON.stringify(music)));
