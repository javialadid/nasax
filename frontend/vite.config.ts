import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite';

const gaScript = `\n      <!-- Google tag (gtag.js) -->\n      <script async src=\"https://www.googletagmanager.com/gtag/js?id=G-1J34N7EEF1\"></script>\n      <script>\n        window.dataLayer = window.dataLayer || [];\n        function gtag(){dataLayer.push(arguments);}\n        gtag('js', new Date());\n        gtag('config', 'G-1J34N7EEF1');\n      </script>\n`;

function gaHtmlTransform(): Plugin {
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

export default defineConfig({
  plugins: [react(), tailwindcss(), gaHtmlTransform()],
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
    },
  },
});