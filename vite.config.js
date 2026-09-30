import {defineConfig} from 'vite';
export default defineConfig({base:process.env.BASE_PATH||'/',build:{rollupOptions:{output:{manualChunks:{maplibre:['maplibre-gl'],search:['opencc-js/t2cn']}}}}});
