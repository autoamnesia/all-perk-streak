// =============================================================================
// STREAMER OVERLAY FUNCTIONS
// =============================================================================

// Global flag to track server capability
let overlayServerAvailable = null; // null = not checked, true = Node.js, false = Python

// Update the streamer overlay file with current progress data
async function updateStreamerOverlay() {
  // Only check server capability once
  if (overlayServerAvailable === null) {
    try {
      const testResponse = await fetch('/api/progress');
      if (testResponse.ok) {
        overlayServerAvailable = true;
        console.log('✅ Node.js server detected - overlay features enabled');
      } else {
        overlayServerAvailable = false;
      }
    } catch (error) {
      overlayServerAvailable = false;
    }
    
    if (!overlayServerAvailable) {
      console.log('⚠️ Python server detected - overlay updates disabled (Node.js required)');
      
      // Update button to show Python server mode (only once)
      const downloadBtn = document.getElementById('download-overlay-btn');
      if (downloadBtn) {
        downloadBtn.textContent = '⚠️ Node.js Required';
        downloadBtn.style.backgroundColor = '#ff9800';
        downloadBtn.title = 'Install Node.js and restart with start_server.bat for overlay features';
        downloadBtn.disabled = true;
      }
      return;
    }
  }
  
  // If we've determined the server doesn't support overlays, skip silently
  if (!overlayServerAvailable) {
    return;
  }
  // If characterData isn't loaded yet, load it first
  if (!characterData) {
    try {
      const res = await fetch("characters.json");
      const data = await res.json();
      characterData = data;
      window.allPerks = data.perks;
    } catch (error) {
      console.error('Failed to load character data for overlay:', error);
      return;
    }
  }

  const completedChars = JSON.parse(localStorage.getItem("dbd_completed_chars") || "[]");
  const usedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
  const overlaySettings = JSON.parse(localStorage.getItem("dbd_overlay_settings") || '{"showKillers":true,"showSurvivors":true,"showCurrentCharacter":false,"compactMode":false}');

  // Count completed characters
  let completedKillers = 0;
  let completedSurvivors = 0;
  
  const validKillerFiles = characterData.killers ? characterData.killers.map(k => k.file) : [];
  const validSurvivorFiles = characterData.survivors ? characterData.survivors.map(s => s.file) : [];
  
  completedChars.forEach(charFile => {
    if (validKillerFiles.includes(charFile)) {
      completedKillers++;
    } else if (validSurvivorFiles.includes(charFile)) {
      completedSurvivors++;
    }
  });

  // Get current character data
  let currentKiller = null;
  let currentSurvivor = null;

  if (selectedCharacter) {
    const currentPerks = usedPerks[selectedCharacter.file] || [];
    const characterInfo = {
      name: selectedCharacter.name,
      perks: currentPerks
    };

    if (selectedCharacter.type === 'killers') {
      currentKiller = characterInfo;
    } else {
      currentSurvivor = characterInfo;
    }
  }

  // Prepare the data object
  const overlayData = {
    killerCompleted: completedKillers,
    killerTotal: characterData.killers ? characterData.killers.length : 0,
    survivorCompleted: completedSurvivors,
    survivorTotal: characterData.survivors ? characterData.survivors.length : 0,
    currentKiller: currentKiller,
    currentSurvivor: currentSurvivor,
    settings: overlaySettings,
    lastUpdated: new Date().toISOString()
  };

  // Debug logging
  console.log('Overlay Data:', overlayData);
  console.log('Completed Characters:', completedChars);
  console.log('Character Data:', characterData);

  // Send data to the server to update the overlay file
  fetch('/api/update-overlay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(overlayData)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('✅ Overlay updated successfully');
      
      // Update button to show success
      const downloadBtn = document.getElementById('download-overlay-btn');
      if (downloadBtn) {
        const originalText = downloadBtn.textContent;
        downloadBtn.textContent = '✅ Overlay Updated!';
        downloadBtn.style.backgroundColor = '#4CAF50';
        
        // Revert button text after 2 seconds
        setTimeout(() => {
          downloadBtn.textContent = originalText;
          downloadBtn.style.backgroundColor = '#4CAF50';
        }, 2000);
      }
    }
  })
  .catch(error => {
    console.error('❌ Error updating overlay:', error);
    
    // Show error message - likely Node.js server not running
    const downloadBtn = document.getElementById('download-overlay-btn');
    if (downloadBtn) {
      downloadBtn.textContent = '❌ Node.js Server Required';
      downloadBtn.style.backgroundColor = '#f44336';
      
      // Revert button text after 5 seconds
      setTimeout(() => {
        downloadBtn.textContent = '🔄 Update Overlay';
        downloadBtn.style.backgroundColor = '#4CAF50';
      }, 5000);
    }
    
    // Show alert with helpful message
    //setTimeout(() => {
      //alert('Streamer Overlay Update Failed!\n\nThis usually means:\n• Node.js server is not running\n• Run start_server.bat to start the server\n• Make sure Node.js is installed\n\nCheck the setup guide for help!');
    //}, 1000);
  });
}

// Update overlay (called by button click)
function downloadStreamerOverlay() {
  updateStreamerOverlay();
}

// Open overlay settings modal
function openOverlaySettings() {
  const modal = document.getElementById('overlay-settings-modal');
  if (!modal) {
    createOverlaySettingsModal();
  }
  document.getElementById('overlay-settings-modal').style.display = 'block';
  
  // Load current settings
  const settings = JSON.parse(localStorage.getItem("dbd_overlay_settings") || '{"showKillers":true,"showSurvivors":true,"showCurrentCharacter":false,"compactMode":false}');
  
  document.getElementById('show-killers').checked = settings.showKillers;
  document.getElementById('show-survivors').checked = settings.showSurvivors;
  document.getElementById('show-current-character').checked = settings.showCurrentCharacter;
  document.getElementById('compact-mode').checked = settings.compactMode;
}

// Create overlay settings modal
function createOverlaySettingsModal() {
  const modal = document.createElement('div');
  modal.id = 'overlay-settings-modal';
  modal.style.cssText = `
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.8);
  `;

  modal.innerHTML = `
    <div style="
      background: #2a2a2a;
      margin: 5% auto;
      padding: 30px;
      border-radius: 10px;
      width: 90%;
      max-width: 600px;
      color: white;
    ">
      <h2 style="color: #f0db4f; margin-bottom: 20px;">📺 Streamer Overlay Settings</h2>
      
      <div style="margin-bottom: 15px;">
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="checkbox" id="show-killers" style="margin-right: 10px;">
          <span>Show Killer Progress</span>
        </label>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="checkbox" id="show-survivors" style="margin-right: 10px;">
          <span>Show Survivor Progress</span>
        </label>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="checkbox" id="show-current-character" style="margin-right: 10px;">
          <span>Show Current Selected Character & Perks</span>
        </label>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="checkbox" id="compact-mode" style="margin-right: 10px;">
          <span>Compact Mode (Side by Side Layout)</span>
        </label>
      </div>
      
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button onclick="saveOverlaySettings()" style="
          background: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
        ">Save Settings</button>
        <button onclick="closeOverlaySettings()" style="
          background: #666;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
        ">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeOverlaySettings();
    }
  });
}

// Save overlay settings
function saveOverlaySettings() {
  const settings = {
    showKillers: document.getElementById('show-killers').checked,
    showSurvivors: document.getElementById('show-survivors').checked,
    showCurrentCharacter: document.getElementById('show-current-character').checked,
    compactMode: document.getElementById('compact-mode').checked
  };
  
  localStorage.setItem("dbd_overlay_settings", JSON.stringify(settings));
  closeOverlaySettings();
  
  // Update the overlay with new settings
  updateStreamerOverlay();
}

// Close overlay settings modal
function closeOverlaySettings() {
  const modal = document.getElementById('overlay-settings-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Auto-update overlay when progress changes
function autoUpdateOverlay() {
  // Update overlay whenever character selection or completion changes
  if (typeof updateStreamerOverlay === 'function') {
    updateStreamerOverlay();
  }
}
