import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {
  generateStudentCommentService,
  generateSupportSummaryService,
  generateRecommendationsService,
  GeminiServiceError,
} from './server/geminiService';

function apiDevMiddleware(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];

        const matchEndpoint =
          url === '/api/generate-student-comment' ||
          url === '/api/generate-support-summary' ||
          url === '/api/generate-recommendations';

        if (matchEndpoint) {
          if (req.method === 'OPTIONS') {
            res.writeHead(200, {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            });
            return res.end();
          }

          if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Phương thức không được hỗ trợ. Dùng POST.' }));
          }

          let bodyStr = '';
          req.on('data', (chunk) => {
            bodyStr += chunk;
          });

          req.on('end', async () => {
            try {
              let body = {};
              if (bodyStr.trim()) {
                body = JSON.parse(bodyStr);
              }

              let result;
              if (url === '/api/generate-student-comment') {
                result = await generateStudentCommentService(body as any);
              } else if (url === '/api/generate-support-summary') {
                result = await generateSupportSummaryService(body as any);
              } else if (url === '/api/generate-recommendations') {
                result = await generateRecommendationsService(body as any);
              }

              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              });
              res.end(JSON.stringify(result));
            } catch (err: any) {
              const status = err instanceof GeminiServiceError ? err.statusCode : 500;
              res.writeHead(status, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              });
              res.end(JSON.stringify({ error: err.message || 'Lỗi xử lý yêu cầu.' }));
            }
          });

          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const key in env) {
    if (!process.env[key]) {
      process.env[key] = env[key];
    }
  }

  return {
    plugins: [react(), tailwindcss(), apiDevMiddleware()],
  };
});
