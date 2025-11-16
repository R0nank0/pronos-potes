#!/usr/bin/env node

/**
 * Simple HTTP server for testing the frontend locally
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');

// MIME types
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    // Remove query string
    let pathname = req.url.split('?')[0];

    // Decode URL
    pathname = decodeURIComponent(pathname);

    // Determine file path
    let filePath;

    if (pathname.startsWith('/data/')) {
        // Serve from data directory
        filePath = path.join(DATA_DIR, pathname.substring(6));
    } else {
        // Serve from public directory
        filePath = pathname === '/' ?
            path.join(PUBLIC_DIR, 'index.html') :
            path.join(PUBLIC_DIR, pathname);
    }

    // Security: Prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (
        !normalizedPath.startsWith(PUBLIC_DIR) &&
        !normalizedPath.startsWith(DATA_DIR)
    ) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    // Get file extension
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File not found
            console.log(`  404 - File not found: ${filePath}`);
            res.writeHead(404);
            res.end('404 Not Found');
            return;
        }

        // Read and serve file
        fs.readFile(filePath, (err, data) => {
            if (err) {
                console.error(`  500 - Error reading file: ${err.message}`);
                res.writeHead(500);
                res.end('500 Internal Server Error');
                return;
            }

            res.writeHead(200, {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            });
            res.end(data);
        });
    });
});

server.listen(PORT, () => {
    console.log('');
    console.log('='.repeat(50));
    console.log('🚀 Pronos Potes - Serveur de développement');
    console.log('='.repeat(50));
    console.log('');
    console.log(`  Serveur démarré sur: http://localhost:${PORT}`);
    console.log('');
    console.log(`  📁 Public: ${PUBLIC_DIR}`);
    console.log(`  📊 Data:   ${DATA_DIR}`);
    console.log('');
    console.log('  Appuyez sur Ctrl+C pour arrêter');
    console.log('');
    console.log('='.repeat(50));
    console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Arrêt du serveur...\n');
    server.close(() => {
        console.log('✅ Serveur arrêté\n');
        process.exit(0);
    });
});
