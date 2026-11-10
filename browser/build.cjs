const esbuild=require('esbuild');
esbuild.buildSync({entryPoints:['src/web/main.jsx'],bundle:true,minify:true,sourcemap:false,outfile:'dist/game.js',loader:{'.js':'jsx'},alias:{'react-native':require('path').resolve('src/web/native-adapter.jsx'),'react-native-svg':require('path').resolve('src/web/svg-adapter.jsx')},define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof'});

require('fs').cpSync('assets/audio','dist/audio',{recursive:true});
