const express = require('express');
const http = require('http');
const url = require('url');
const path = require('path');

const API_TARGET = process.env.API_TARGET || 'http://localhost:3001';
const BUILD_DIR = path.join(__dirname, '..', 'build');

const app = express();

// Proxy /api/* to the backend API
app.use('/api', (req, res) => {
  const target = API_TARGET + req.originalUrl;
  const parsed = url.parse(target);

  const options = {
    hostname: parsed.hostname,
    port: parsed.port,
    path: parsed.path + (parsed.search || ''),
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) res.status(502).send('Bad Gateway');
  });

  // Pipe request body
  req.pipe(proxyReq, { end: true });
});

// Serve static build files
app.use(express.static(BUILD_DIR));

// SPA fallback (use regex to avoid path-to-regexp issues with '*' patterns)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(BUILD_DIR, 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Static+API proxy running on http://127.0.0.1:${port} (proxy -> ${API_TARGET})`);
});
