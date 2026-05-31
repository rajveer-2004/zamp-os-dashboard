// devServer.js
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, URL } from 'url';

// Load environment variables from .env if present
import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// Content types helper
const CONTENT_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Helper to buffer and parse JSON body
async function getRequestBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

// Map serverless dynamic paths
// e.g. /api/clients/1 -> api/clients/[id]/index.js with req.query.id = 1
// e.g. /api/clients/1/snapshots -> api/clients/[id]/snapshots/index.js with req.query.id = 1
function getRouteHandlerPath(pathname, req) {
  if (pathname === '/api/auth/login') return { handlerPath: './api/auth/login.js', query: {} };
  if (pathname === '/api/auth/logout') return { handlerPath: './api/auth/logout.js', query: {} };
  if (pathname === '/api/auth/me') return { handlerPath: './api/auth/me.js', query: {} };
  if (pathname === '/api/clients') return { handlerPath: './api/clients/index.js', query: {} };
  if (pathname === '/api/brief') return { handlerPath: './api/brief.js', query: {} };
  if (pathname === '/api/portfolio-brief') return { handlerPath: './api/portfolio-brief.js', query: {} };

  // Check client dynamic routes:
  // Regex for /api/clients/<id>
  const clientMatch = pathname.match(/^\/api\/clients\/(\d+)\/?$/);
  if (clientMatch) {
    return {
      handlerPath: './api/clients/[id]/index.js',
      query: { id: clientMatch[1] }
    };
  }

  // Regex for /api/clients/<id>/snapshots
  const snapshotMatch = pathname.match(/^\/api\/clients\/(\d+)\/snapshots\/?$/);
  if (snapshotMatch) {
    return {
      handlerPath: './api/clients/[id]/snapshots/index.js',
      query: { id: snapshotMatch[1] }
    };
  }

  return { handlerPath: null, query: {} };
}

// Server handler
const server = http.createServer(async (req, res) => {
  // Parse URL and query strings
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  
  // Extract query parameters
  const query = {};
  for (const [key, val] of parsedUrl.searchParams.entries()) {
    query[key] = val;
  }

  // Augment response with express-like methods
  res.status = function(code) {
    res.statusCode = code;
    return res;
  };

  res.json = function(data) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  // Route API requests
  if (pathname.startsWith('/api/')) {
    const { handlerPath, query: routeQuery } = getRouteHandlerPath(pathname, req);

    if (handlerPath) {
      try {
        const fullPath = path.join(__dirname, handlerPath);
        const module = await import(`file://${fullPath}`);
        
        // Parse request body
        req.body = await getRequestBody(req);
        
        // Merge queries
        req.query = { ...query, ...routeQuery };

        // Execute serverless handler
        return module.default(req, res);
      } catch (err) {
        console.error(`API Route Error (${pathname}):`, err);
        return res.status(500).json({ error: 'Server error in API handler' });
      }
    } else {
      return res.status(404).json({ error: 'API route not found' });
    }
  }

  // Serve static client assets (built in client/dist)
  let relativeFilePath = pathname === '/' ? 'index.html' : pathname;
  let clientFilePath = path.join(__dirname, 'client', 'dist', relativeFilePath);

  // Check if file exists, if not fallback to index.html (SPA client routing)
  fs.access(clientFilePath, fs.constants.F_OK, (err) => {
    if (err) {
      // Fallback to index.html
      clientFilePath = path.join(__dirname, 'client', 'dist', 'index.html');
    }

    // Read and serve the file
    fs.readFile(clientFilePath, (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Error loading dashboard frontend');
        return;
      }

      const ext = path.extname(clientFilePath);
      const contentType = CONTENT_TYPES[ext.toLowerCase()] || 'application/octet-stream';
      
      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`⚡ Zamp Nexus OS is running successfully!`);
  console.log(`📍 Web Dashboard URL: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
