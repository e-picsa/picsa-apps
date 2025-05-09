/**
 * Custom Angular proxy to redirect calls to /api endpoint to target supabase backend
 * This is used when running locally to bypass CORS
 * 
 * https://angular.dev/tools/cli/serve#proxying-to-a-backend-server
 * 
 * Can be included in any angular project by specifying serve options from `project.json`
 * 
 * _project.json_
 * ```json
 "serve": {
      "options": {
        "proxyConfig": "{workspaceRoot}/proxy.conf.js"
      }
    },
 * ```
 */
exports.default = {
  '/api': {
    target: 'http://localhost:54321',
    secure: false,
    changeOrigin: true,
    pathRewrite: {
      '^/api': '',
    },
  },
};
