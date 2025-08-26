// Progress sync script - monitors localStorage and sends updates to server
(function() {
  // Only run sync if we're on localhost (self-hosting)
  const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (!isLocalHost) {
    console.log('📄 Running on static hosting - streamer sync disabled');
    return;
  }

  let lastProgressData = null;
  let charactersData = null;
  let serverAvailable = false;

  // Test if server is available
  async function testServer() {
    try {
      const response = await fetch('/api/progress');
      serverAvailable = response.ok;
      if (serverAvailable) {
        console.log('🚀 Streamer server detected - sync enabled');
      }
    } catch (error) {
      serverAvailable = false;
      console.log('📄 No streamer server - running in basic mode');
    }
    return serverAvailable;
  }

  // Load characters data
  async function loadCharacters() {
    try {
      const response = await fetch('characters.json');
      charactersData = await response.json();
      console.log('📋 Characters data loaded for progress sync');
    } catch (error) {
      console.error('Error loading characters for sync:', error);
    }
  }

  // Calculate current progress from localStorage
  function calculateProgress() {
    if (!charactersData) return null;

    try {
      const completedChars = JSON.parse(localStorage.getItem('dbd_completed_chars') || '[]');

      // Always get totals from charactersData, never from localStorage or progress.json
      const killerTotal = charactersData.killers ? charactersData.killers.length : 0;
      const survivorTotal = charactersData.survivors ? charactersData.survivors.length : 0;

      const killerCompleted = completedChars.filter(charFile => {
        return charactersData.killers.some(killer => killer.file === charFile);
      }).length;
      const survivorCompleted = completedChars.filter(charFile => {
        return charactersData.survivors.some(survivor => survivor.file === charFile);
      }).length;

      return {
        killerCompleted,
        killerTotal,
        survivorCompleted,
        survivorTotal
      };
    } catch (error) {
      console.error('Error calculating progress:', error);
      return null;
    }
  }

  // Send progress update to server
  async function updateServer(progressData) {
    if (!serverAvailable) return;
    
    try {
      const response = await fetch('/api/update-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(progressData),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (response.ok) {
        console.log('📡 Progress synced to server:', progressData);
      } else {
        console.warn('Server sync failed - continuing in basic mode');
        serverAvailable = false; // Disable further attempts if server goes down
      }
    } catch (error) {
      // Silently fail - server might be down or in basic mode
      serverAvailable = false; // Disable further attempts on error
    }
  }

  // Check for progress changes and sync
  function checkAndSync() {
    const currentProgress = calculateProgress();
    if (!currentProgress) return;

    // Compare with last known progress
    const progressString = JSON.stringify(currentProgress);
    if (progressString !== lastProgressData) {
      lastProgressData = progressString;
      updateServer(currentProgress);
    }
  }

  // Initialize
  async function init() {
    await testServer();
    if (serverAvailable) {
      await loadCharacters();
      // Initial sync
      checkAndSync();
      // Check for changes every 1 second
      setInterval(checkAndSync, 1000);
      console.log('🚀 Progress sync initialized');
    }
  }
  
  init();
})();
