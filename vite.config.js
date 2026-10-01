import {defineConfig} from 'vite';
export default defineConfig({base:process.env.BASE_PATH||'/',build:{outDir:process.env.BUILD_DIR||'dist',rollupOptions:{output:{manualChunks:{maplibre:['maplibre-gl'],search:['opencc-js/t2cn']}}}}});
