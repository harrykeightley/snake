import {defineConfig, loadEnv} from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      'process.env.PINO_LOG_LEVEL': JSON.stringify(
        env.PINO_LOG_LEVEL ?? 'info'
      ),
    },
    plugins: [react()],
  };
});
