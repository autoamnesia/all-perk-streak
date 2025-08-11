const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;
const OVERLAY_FILE = 'streamer-overlay.html';

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle CORS for API requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API endpoint to get current progress
  if (pathname === '/api/progress' && req.method === 'GET') {
    try {
      // Read progress data from a file or return default
      let progressData = {
        killerCompleted: 0,
        killerTotal: 40,
        survivorCompleted: 0,
        survivorTotal: 48
      };
      
      // Try to read saved progress
      if (fs.existsSync('progress.json')) {
        const savedProgress = JSON.parse(fs.readFileSync('progress.json', 'utf8'));
        progressData = { ...progressData, ...savedProgress };
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(progressData));
    } catch (error) {
      console.error('Error getting progress:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // API endpoint to update progress
  if (pathname === '/api/update-progress' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const progressData = JSON.parse(body);
        
        // Save progress to file
        fs.writeFileSync('progress.json', JSON.stringify(progressData, null, 2));
        console.log('📊 Progress updated:', progressData);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Progress updated successfully' }));
      } catch (error) {
        console.error('Error updating progress:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }

  // API endpoint to update overlay
  if (pathname === '/api/update-overlay' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const overlayData = JSON.parse(body);
        updateOverlayFile(overlayData);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Overlay updated successfully' }));
      } catch (error) {
        console.error('Error updating overlay:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = '.' + pathname;
  
  // Default to index.html
  if (pathname === '/') {
    filePath = './index.html';
  }

  // Get file extension and MIME type
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  // Read and serve the file
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Function to update the overlay HTML file
function updateOverlayFile(overlayData) {
  const overlayHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DBD Perk Streak - Streamer Overlay</title>
  <link rel="stylesheet" href="streamer-overlay.css">
</head>
<body>
  <div class="overlay-container">
    <div class="streak-text killer-text">
      <span id="killer-count">0/0</span> Killers Done
    </div>
    
    <div class="streak-text survivor-text">
      <span id="survivor-count">0/0</span> Survivors Done
    </div>
  </div>

  <script>
    // Fetch progress from server API
    async function updateCounts() {
      try {
        console.log('🔄 Fetching progress from server...');
        const response = await fetch('/api/progress');
        
        if (!response.ok) {
          throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
        }
        
        const progressData = await response.json();
        console.log('📊 Progress data:', progressData);
        
        // Update display
        document.getElementById('killer-count').textContent = \`\${progressData.killerCompleted}/\${progressData.killerTotal}\`;
        document.getElementById('survivor-count').textContent = \`\${progressData.survivorCompleted}/\${progressData.survivorTotal}\`;
        
        console.log(\`✅ Display updated: Killers \${progressData.killerCompleted}/\${progressData.killerTotal}, Survivors \${progressData.survivorCompleted}/\${progressData.survivorTotal}\`);
      } catch (error) {
        console.error('❌ Error fetching progress:', error);
        document.getElementById('killer-count').textContent = 'Error';
        document.getElementById('survivor-count').textContent = 'Error';
      }
    }

    // Update counts when page loads
    updateCounts();
    
    // Auto-refresh every 2 seconds
    setInterval(() => {
      updateCounts();
    }, 2000);
  </script>
</body>
</html>`;

  // Write the updated HTML to the overlay file
  fs.writeFileSync(OVERLAY_FILE, overlayHTML);
  console.log(`✅ Overlay updated at ${new Date().toLocaleString()}`);
}

// Start the server
server.listen(PORT, () => {
  console.log('🚀 DBD All Perk Streak Server started!');
  console.log(`🌐 Main app: http://localhost:${PORT}`);
  console.log(`📺 Streamer overlay: http://localhost:${PORT}/streamer-overlay.html`);
  console.log('');
  console.log('📋 OBS Setup:');
  console.log('1. Add Browser Source in OBS');
  console.log(`2. Set URL to: http://localhost:${PORT}/streamer-overlay.html`);
  console.log('3. Set Width: 400, Height: 300 (or adjust as needed)');
  console.log('4. The overlay will update automatically as you make progress!');
  console.log('');
  console.log('Press Ctrl+C to stop the server.');
});

// Create initial overlay file if it doesn't exist
if (!fs.existsSync(OVERLAY_FILE)) {
  const initialData = {
    killerCompleted: 0,
    killerTotal: 40,
    survivorCompleted: 0,
    survivorTotal: 40,
    currentKiller: null,
    currentSurvivor: null,
    settings: {
      showKillers: true,
      showSurvivors: true,
      showCurrentCharacter: false,
      compactMode: false
    },
    lastUpdated: new Date().toISOString()
  };
  
  // updateOverlayFile(initialData); // Disabled to preserve custom overlay
  console.log('📄 Server started - overlay file preserved');
}
