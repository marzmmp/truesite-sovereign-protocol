/**
 * Sovereign Protocol — Static File Server
 * Port 4000 | TrueSite Technologies | 3565
 * Plain CommonJS — no build step needed
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4000;
const HTML_FILE = path.join(__dirname, 'sovereign-protocol.html');

const server = http.createServer((req, res) => {
  // Health check
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'sovereign-protocol', port: PORT }));
    return;
  }

  // Serve the protocol HTML for all routes
  fs.readFile(HTML_FILE, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('sovereign-protocol.html not found in ' + __dirname);
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[sovereign-protocol] ✅ Live at http://0.0.0.0:${PORT}`);
  console.log(`[sovereign-protocol] LAN:  http://192.168.68.80:${PORT}`);
  console.log(`[sovereign-protocol] Web:  https://sovereign.true-site.tech`);
});
