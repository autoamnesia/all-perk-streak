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
        killerTotal: 41,
        survivorCompleted: 0,
        survivorTotal: 49,
        completedKillers: []
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
        const newProgressData = JSON.parse(body);
        
        // Read existing progress to preserve any additional data
        let existingProgress = {
          killerCompleted: 0,
          killerTotal: 41,
          survivorCompleted: 0,
          survivorTotal: 49,
          completedKillers: [],
          completedSurvivors: []
        };
        
        if (fs.existsSync('progress.json')) {
          try {
            const existing = JSON.parse(fs.readFileSync('progress.json', 'utf8'));
            existingProgress = { ...existingProgress, ...existing };
          } catch (e) {
            console.warn('Could not read existing progress, using defaults');
          }
        }
        
        // Merge new data with existing, ensuring we keep completed arrays
        const progressData = { 
          ...existingProgress, 
          ...newProgressData,
          // Ensure arrays are preserved if they exist in new data
          completedKillers: newProgressData.completedKillers || existingProgress.completedKillers || [],
          completedSurvivors: newProgressData.completedSurvivors || existingProgress.completedSurvivors || []
        };
        
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

function updateOverlayFile(overlayData) {

  const overlayHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DBD Perk Streak - Streamer Overlay</title>
  <link rel="stylesheet" href="streamer-overlay.css">
  <style>
    #secret-image {
      display: none;
      position: absolute;
      top: 0; left: 0; right: 0; margin: auto;
      max-width: 100%; max-height: 100%;
      z-index: 10;
      opacity: 0;
      transition: opacity 0.5s;
      pointer-events: none;
    }
    
    #killer-card { 
      position: relative; 
    }
    
    #completed-killers-title {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      background: rgba(0, 0, 0, 0.95);
      color: #ff6b6b;
      font-size: 18px;
      font-weight: bold;
      z-index: 16;
      pointer-events: none;
      text-align: center;
      padding: 12px 0;
      border-radius: 6px 6px 0 0;
      display: none;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    #completed-killers-title.show {
      display: block;
      opacity: 1;
    }
    
    #completed-killers-count {
      position: absolute;
      top: 12px;
      right: 15px;
      color: #ff6b6b;
      font-size: 14px;
      font-weight: bold;
      z-index: 17;
      pointer-events: none;
      display: none;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    #completed-killers-count.show {
      display: block;
      opacity: 1;
    }
    
    #completed-killers-display {
      position: absolute;
      top: 42px;
      left: 0;
      width: 100%;
      height: calc(100% - 42px);
      background: rgba(0, 0, 0, 0.95);
      color: white;
      padding: 20px;
      text-align: center;
      display: none;
      opacity: 0;
      z-index: 15;
      box-sizing: border-box;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      border-radius: 0 0 8px 8px;
      transition: opacity 0.3s ease;
    }
    
    #completed-killers-display.show {
      display: flex;
      opacity: 1;
    }
    
    #completed-killers-list {
      font-size: 18px;
      line-height: 1.4;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      width: 100%;
    }
    
    #completed-killers-list .killer-column {
      flex: 1;
      min-width: 45%;
      padding: 0 8px;
    }
    
    #completed-killers-list .killer-name {
      display: block;
      padding: 4px 0;
      color: #ffffff;
    }
    
    #completed-killers-list .killer-item {
      display: flex;
      align-items: center;
      padding: 4px 0;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
    }
    
    #completed-killers-list .killer-image {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      margin-right: 8px;
      object-fit: cover;
      border: 1px solid #ff6b6b;
      flex-shrink: 0;
    }
    
    #completed-killers-list .killer-item span {
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 16px;
    }
    
    /* Showcase Mode Styles */
    #killer-showcase {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      display: none;
      opacity: 0;
      z-index: 20;
      box-sizing: border-box;
      justify-content: center;
      align-items: center;
      border-radius: 18px;
      transition: opacity 0.3s ease;
      padding: 20px;
      overflow: hidden;
    }
    
    #killer-showcase.show {
      display: flex;
      opacity: 1;
    }
    
    /* Hide content when showcase is active */
    #killer-card:has(#killer-showcase.show) .overlay-title,
    #killer-card:has(#killer-showcase.show) .progress-section {
      visibility: hidden;
    }
    
    #killer-showcase-total {
      position: absolute;
      top: 5px;
      left: 5px;
      font-size: 24px;
      font-weight: bold;
      color: #ffffff;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
      z-index: 21;
    }
    
    #killer-showcase-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      padding-left: 5px;
    }
    
    #killer-showcase-number {
      font-size: 64px;
      font-weight: bold;
      color: #ffffff;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
      flex-shrink: 0;
      min-width: 100px;
      text-align: right;
      padding-right: 5px;
    }
    
    #killer-showcase-portrait {
      width: 180px;
      height: 180px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
    }
    
    #killer-showcase-perks {
      position: relative;
      width: 180px;
      height: 180px;
      flex-shrink: 0;
      margin-right: 20px;
    }
    
    .showcase-perk-wrapper {
      position: absolute;
      width: 90px;
      height: 90px;
      background-image: url('assets/icons/Background.webp');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      border: none;
    }
    
    .showcase-perk {
      width: 100%;
      height: 100%;
      object-fit: cover;
      position: relative;
      z-index: 1;
      border: none;
    }
    
    /* Diamond/rotated square layout - perks touch in middle */
    .showcase-perk-wrapper:nth-child(1) {
      top: 0;
      left: 45px;
    }
    
    .showcase-perk-wrapper:nth-child(2) {
      top: 45px;
      right: 0;
    }
    
    .showcase-perk-wrapper:nth-child(3) {
      bottom: 0;
      left: 45px;
    }
    
    .showcase-perk-wrapper:nth-child(4) {
      top: 45px;
      left: 0;
    }
  </style>
</head>
<body>
  <div class="overlay-card" id="killer-card">
    <div class="overlay-title">All Perk Streak</div>
    <div class="progress-section">
      <div class="progress-bar-bg">
        <div class="progress-bar-fill killer-fill" id="killer-bar" style="width: 0%"></div>
      </div>
      <div class="progress-count" id="killer-count">0/0</div>
    </div>
    <img id="secret-image" src="assets/characters/a.jpg" alt="Secret" />
    
    <div id="completed-killers-title">Completed Killers</div>
    <div id="completed-killers-count">0/0</div>
    <div id="completed-killers-display">
      <div id="completed-killers-list"></div>
    </div>
    
    <!-- New Showcase Mode Display -->
    <div id="killer-showcase">
      <div id="killer-showcase-total">0/41</div>
      <div id="killer-showcase-content">
        <div id="killer-showcase-number">1</div>
        <img id="killer-showcase-portrait" src="" alt="Killer">
        <div id="killer-showcase-perks"></div>
      </div>
    </div>
  </div>
  <div class="overlay-card" id="survivor-card" style="margin-top:16px;">
    <div class="overlay-title">All Perk Streak</div>
    <div class="progress-section">
      <div class="progress-bar-bg">
        <div class="progress-bar-fill survivor-fill" id="survivor-bar" style="width: 0%"></div>
      </div>
      <div class="progress-count" id="survivor-count">0/0</div>
    </div>
  </div>

  <script>
    // ========== DISPLAY MODE TOGGLE ==========
    // Change this to switch between display modes:
    // 'list' - Shows multiple killers in a list (current behavior)
    // 'showcase' - Shows one killer at a time with their perks in diamond grid
    const DISPLAY_MODE = 'showcase'; // Options: 'list' or 'showcase'
    
    let completedKillers = [];
    let currentCycleIndex = 0;
    const killersPerPage = 8; // Changed from 4 to 8
    const cycleInterval = 600000; // 10 minute between complete cycles
    const displayDuration = 5000; // Show each set for 5 seconds
    let hasShownInitial = false;
    let isShowing = false;
    let lastKillerCount = 0;
    let lastKillersData = ''; // Store serialized killer data to detect perk changes
    let cycleIntervalId = null; // Store the interval ID so we can reset it
    let showcaseTimeoutId = null; // Store timeout ID to prevent rapid changes causing short displays
    let displayTimeoutId = null; // Store the display duration timeout ID
    let nextShowTimeoutId = null; // Store the next show timeout ID

    // Show both killer and survivor progress at once
    async function updateBoth() {
      try {
        const response = await fetch('/api/progress');
        if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + response.statusText);
        const progressData = await response.json();
        
        // Store completed killers
        const newKillerCount = (progressData.completedKillers || []).length;
        const newKillersData = JSON.stringify(progressData.completedKillers || []);
        
        // If killer data changed (count or perks), reset the display and timer
        if (newKillersData !== lastKillersData) {
          const dataChanged = lastKillersData !== ''; // Only reset if we had previous data
          
          if (dataChanged) {
            // Clear ALL pending timeouts to prevent rapid changes
            if (showcaseTimeoutId) {
              clearTimeout(showcaseTimeoutId);
              showcaseTimeoutId = null;
            }
            if (displayTimeoutId) {
              clearTimeout(displayTimeoutId);
              displayTimeoutId = null;
            }
            if (nextShowTimeoutId) {
              clearTimeout(nextShowTimeoutId);
              nextShowTimeoutId = null;
            }
            
            // Hide any current display
            const overlay = document.getElementById('completed-killers-display');
            const showcase = document.getElementById('killer-showcase');
            const title = document.getElementById('completed-killers-title');
            const count = document.getElementById('completed-killers-count');
            
            overlay.classList.remove('show');
            showcase.classList.remove('show');
            title.classList.remove('show');
            count.classList.remove('show');
            
            // Reset state
            isShowing = false;
            currentCycleIndex = 0;
            
            // Clear and restart the cycle timer
            if (cycleIntervalId) {
              clearInterval(cycleIntervalId);
              cycleIntervalId = null;
            }
            startKillerCycling();
            
            // Trigger immediate showcase if we have killers
            if ((progressData.completedKillers || []).length > 0) {
              showcaseTimeoutId = setTimeout(() => startKillerShowcycle(), 2000);
            }
          }
        }
        
        completedKillers = progressData.completedKillers || [];
        lastKillerCount = newKillerCount;
        lastKillersData = newKillersData;
        
        // Show initial display for testing
        if (!hasShownInitial && completedKillers.length > 0) {
          hasShownInitial = true;
          setTimeout(() => startKillerShowcycle(), 2000);
        }
        
        // Killer
        document.getElementById('killer-count').textContent = progressData.killerCompleted + '/' + progressData.killerTotal;
        const killerPercent = progressData.killerTotal > 0 ? (progressData.killerCompleted / progressData.killerTotal) * 100 : 0;
        document.getElementById('killer-bar').style.width = killerPercent + '%';
        // Survivor
        document.getElementById('survivor-count').textContent = progressData.survivorCompleted + '/' + progressData.survivorTotal;
        const survivorPercent = progressData.survivorTotal > 0 ? (progressData.survivorCompleted / progressData.survivorTotal) * 100 : 0;
        document.getElementById('survivor-bar').style.width = survivorPercent + '%';
      } catch (error) {
        document.getElementById('killer-count').textContent = 'Error';
        document.getElementById('killer-bar').style.width = '0%';
        document.getElementById('survivor-count').textContent = 'Error';
        document.getElementById('survivor-bar').style.width = '0%';
      }
    }

    // Show one set of killers and cycle through all sets
    function startKillerShowcycle() {
      if (completedKillers.length === 0 || isShowing) return;
      
      isShowing = true;
      currentCycleIndex = 0; // Reset to first page
      showCurrentKillerSet();
    }

    function showCurrentKillerSet() {
      // Check if we still have killers to show (in case list was emptied)
      if (completedKillers.length === 0) {
        hideAllDisplays();
        isShowing = false;
        return;
      }
      
      if (DISPLAY_MODE === 'showcase') {
        // Showcase mode: show one killer at a time
        if (currentCycleIndex >= completedKillers.length) {
          currentCycleIndex = 0;
        }
        
        showKillerShowcase();
        
        displayTimeoutId = setTimeout(() => {
          if (!isShowing) return;
          
          const nextCycleIndex = (currentCycleIndex + 1) % completedKillers.length;
          
          if (nextCycleIndex === 0) {
            // Completed full cycle
            hideAllDisplays();
            isShowing = false;
          } else {
            currentCycleIndex = nextCycleIndex;
            nextShowTimeoutId = setTimeout(() => showCurrentKillerSet(), 100);
          }
        }, displayDuration);
      } else {
        // List mode: show multiple killers
        const totalPages = Math.ceil(completedKillers.length / killersPerPage);
        if (currentCycleIndex >= totalPages) {
          currentCycleIndex = 0;
        }
        
        showKillerList();
        
        displayTimeoutId = setTimeout(() => {
          if (!isShowing) return;
          
          const updatedTotalPages = Math.ceil(completedKillers.length / killersPerPage);
          const nextCycleIndex = (currentCycleIndex + 1) % updatedTotalPages;
          
          if (nextCycleIndex === 0) {
            hideAllDisplays();
            isShowing = false;
          } else {
            currentCycleIndex = nextCycleIndex;
            nextShowTimeoutId = setTimeout(() => showCurrentKillerSet(), 100);
          }
        }, displayDuration);
      }
    }
    
    function hideAllDisplays() {
      const overlay = document.getElementById('completed-killers-display');
      const showcase = document.getElementById('killer-showcase');
      const title = document.getElementById('completed-killers-title');
      const count = document.getElementById('completed-killers-count');
      
      overlay.classList.remove('show');
      showcase.classList.remove('show');
      title.classList.remove('show');
      count.classList.remove('show');
    }
    
    function showKillerList() {
      updateCompletedKillersDisplay();
      const overlay = document.getElementById('completed-killers-display');
      const showcase = document.getElementById('killer-showcase');
      const title = document.getElementById('completed-killers-title');
      const count = document.getElementById('completed-killers-count');
      
      // Hide showcase, show list
      showcase.classList.remove('show');
      
      // Update count display to show completed killers count
      count.textContent = \`\${completedKillers.length}/41\`;
      
      // Show all elements together
      overlay.classList.add('show');
      title.classList.add('show');
      count.classList.add('show');
    }
    
    function showKillerShowcase() {
      const killer = completedKillers[currentCycleIndex];
      if (!killer) return;
      
      const overlay = document.getElementById('completed-killers-display');
      const showcase = document.getElementById('killer-showcase');
      const title = document.getElementById('completed-killers-title');
      const count = document.getElementById('completed-killers-count');
      const totalDisplay = document.getElementById('killer-showcase-total');
      const numberDisplay = document.getElementById('killer-showcase-number');
      const portrait = document.getElementById('killer-showcase-portrait');
      const perksContainer = document.getElementById('killer-showcase-perks');
      
      // Hide list and top bar elements, show showcase
      overlay.classList.remove('show');
      title.classList.remove('show');
      count.classList.remove('show');
      
      // Set total completed killers
      totalDisplay.textContent = \`\${completedKillers.length}/41\`;
      
      // Set killer number (1-based index) with period
      numberDisplay.textContent = \`\${currentCycleIndex + 1}.\`;
      
      // Set killer portrait
      portrait.src = \`assets/characters/killers/\${killer.id}.webp\`;
      portrait.alt = killer.name;
      
      // Clear and populate perks
      perksContainer.innerHTML = '';
      if (killer.perks && killer.perks.length > 0) {
        // Get killer type from ID to construct proper perk path
        const perkType = 'killers'; // completed killers are always killers
        
        killer.perks.forEach((perkFile) => {
          // Create wrapper with background
          const perkWrapper = document.createElement('div');
          perkWrapper.className = 'showcase-perk-wrapper';
          
          // Create perk image
          const perkImg = document.createElement('img');
          perkImg.className = 'showcase-perk';
          // perkFile already includes .webp extension
          perkImg.src = \`assets/perks/\${perkType}/\${perkFile}\`;
          perkImg.alt = perkFile;
          perkImg.onerror = function() {
            console.log('Failed to load perk:', perkFile);
            this.style.display = 'none';
          };
          
          perkWrapper.appendChild(perkImg);
          perksContainer.appendChild(perkWrapper);
        });
      }
      
      // Show showcase (title and count remain hidden)
      showcase.classList.add('show');
    }

    // Update the completed killers display with current set
    function updateCompletedKillersDisplay() {
      const list = document.getElementById('completed-killers-list');
      
      if (completedKillers.length === 0) {
        list.innerHTML = '<div class="killer-name">No killers completed yet</div>';
        return;
      }

      // Calculate which killers to show
      const startIndex = currentCycleIndex * killersPerPage;
      const endIndex = Math.min(startIndex + killersPerPage, completedKillers.length);
      const killersToShow = completedKillers.slice(startIndex, endIndex);

      // Clear and populate the list with two columns
      list.innerHTML = '';
      
      // Create left and right columns
      const leftColumn = document.createElement('div');
      leftColumn.className = 'killer-column';
      const rightColumn = document.createElement('div');
      rightColumn.className = 'killer-column';
      
      killersToShow.forEach((killer, index) => {
        const killerItem = document.createElement('div');
        killerItem.className = 'killer-item';
        
        const killerImage = document.createElement('img');
        killerImage.className = 'killer-image';
        killerImage.src = \`assets/characters/killers/\${killer.id}.webp\`;
        killerImage.alt = killer.name;
        killerImage.onerror = function() {
          this.style.display = 'none';
        };
        
        const killerText = document.createElement('span');
        const killerNumber = startIndex + index + 1;
        const killerName = killer.name.replace(/^The\s+/, '');
        killerText.textContent = \`\${killerNumber}. \${killerName}\`;
        
        killerItem.appendChild(killerImage);
        killerItem.appendChild(killerText);
        
        // Alternate between left and right columns
        if (index % 2 === 0) {
          leftColumn.appendChild(killerItem);
        } else {
          rightColumn.appendChild(killerItem);
        }
      });
      
      list.appendChild(leftColumn);
      list.appendChild(rightColumn);
    }

    // Start the cycling display
    function startKillerCycling() {
      // Clear any existing interval
      if (cycleIntervalId) {
        clearInterval(cycleIntervalId);
      }
      // Start new interval
      cycleIntervalId = setInterval(startKillerShowcycle, cycleInterval);
    }

    updateBoth();
    setInterval(updateBoth, 2000);
    startKillerCycling();

    // --- OBS-safe secret image logic ---
    function showSecretImage() {
      var img = document.getElementById('secret-image');
      img.style.display = 'block';
      setTimeout(function() { img.style.opacity = '1'; }, 10);
      setTimeout(function() {
        img.style.opacity = '0';
        setTimeout(function() { img.style.display = 'none'; }, 500);
      }, 5000);
      
      console.log('🕑 Secret image shown, next in 1 hour');
    }

    var secretImageTimerStarted = false;

    function startSecretImageTimer() {
      if (secretImageTimerStarted) return; // Prevent multiple timers
      
      var savedNextTime = localStorage.getItem('nextSecretImageTime');
      var now = Date.now();
      var oneHour = 60 * 60 * 1000;
      
      var nextTime;
      
      if (savedNextTime) {
        nextTime = parseInt(savedNextTime, 10);
        
        // If the scheduled time has passed, reset to 1 hour from now
        if (now >= nextTime) {
          nextTime = now + oneHour;
          localStorage.setItem('nextSecretImageTime', nextTime.toString());
          console.log('🕑 Missed timer, reset to 1 hour from now');
        }
      } else {
        // First time, set timer for 1 hour from now
        nextTime = now + oneHour;
        localStorage.setItem('nextSecretImageTime', nextTime.toString());
        console.log('🕑 First load: secret image timer set for 1 hour from now');
      }
      
      var timeUntilNext = nextTime - now;
      secretImageTimerStarted = true;
      
      setTimeout(function() {
        showSecretImage();
        // Set next timer for 1 hour
        var newNextTime = Date.now() + oneHour;
        localStorage.setItem('nextSecretImageTime', newNextTime.toString());
        secretImageTimerStarted = false; // Allow restart
        startSecretImageTimer(); // Restart the cycle
      }, timeUntilNext);
    }

    function checkSecretImageTimer() {
      if (completedKillers.length >= 5 && !secretImageTimerStarted) {
        console.log('🕑 5+ killers completed, starting secret image timer');
        startSecretImageTimer();
      }
    }

    // Call this check after updating progress
    setInterval(function() {
      checkSecretImageTimer();
    }, 5000); // Check every 5 seconds
  </script>
</body>
</html>`;

  fs.writeFileSync(OVERLAY_FILE, overlayHTML);
  console.log(`✅ Overlay updated at ${new Date().toLocaleString()}`);
}
// Start the server
server.listen(PORT, () => {
  console.log('DBD All Perk Streak Server started!');
  console.log(`Main app: http://localhost:${PORT}`);
  console.log(`Streamer overlay: http://localhost:${PORT}/streamer-overlay.html`);
  console.log('');
  console.log('OBS Setup:');
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
    killerTotal: 41,
    survivorCompleted: 0,
    survivorTotal: 49,
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
  console.log('4. The overlay will update automatically as you make progress!');
  console.log('');
  console.log('Press Ctrl+C to stop the server.');

// Create initial overlay file if it doesn't exist
if (!fs.existsSync(OVERLAY_FILE)) {
  const initialData = {
    killerCompleted: 0,
    killerTotal: 41,
    survivorCompleted: 0,
    survivorTotal: 49,
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
