// Small local server for the art workbench and its browser checks.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function artServer() {
  const server = http.createServer((req, res) => {
    let file;
    try { file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); }
    catch { res.writeHead(400).end(); return; }
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (error, data) => {
      if (error) { res.writeHead(404).end(); return; }
      const types = {'.html':'text/html', '.js':'text/javascript', '.json':'application/json', '.png':'image/png', '.css':'text/css'};
      res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      res.end(data);
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({server, url:`http://127.0.0.1:${server.address().port}`})));
}
module.exports = {artServer};
if (require.main === module) artServer().then(({url}) => console.log(`Appearance: ${url}/tools/hero-kit.html\nBlade kit: ${url}/tools/blade-kit.html`));
