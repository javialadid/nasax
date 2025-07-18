import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite';

// gaScript will be created inside the config function

function gaHtmlTransform(gaScript: string): Plugin {
  return {
    name: 'inject-ga-script',
    transformIndexHtml(html, ctx) {
      if (ctx && ctx.server) return html.replace('%GA_SCRIPT%', ''); // dev
      // prod build
      return html.replace('%GA_SCRIPT%', gaScript);
    },
    enforce: 'pre',
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const gaMeasurementId = env.VITE_GA_MEASUREMENT_ID;
  const gaScript = `
      <!-- Google tag (gtag.js) -->
      <script async src="https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaMeasurementId}');
      </script>
  `;
  return {
    plugins: [react(), tailwindcss(), gaHtmlTransform(gaScript)],
    resolve: {
      alias: {
        '@': '/src',
        '@components': '/src/components',
      },
    },
  };
});