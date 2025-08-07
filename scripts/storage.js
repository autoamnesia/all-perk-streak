// =============================================================================
// DATA STORAGE AND PERSISTENCE
// =============================================================================

//Saves perks
function saveUsedPerks(characterFile, perkFiles) {
  let usedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
  usedPerks[characterFile] = perkFiles;
  localStorage.setItem("dbd_used_perks", JSON.stringify(usedPerks));
}

//Checks which perks are used
function isPerkUsed(perkFile) {
  let usedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
  return Object.values(usedPerks).some(perks => perks.includes(perkFile));
}

// Download progress data as JSON file
function downloadProgress() {
  const progressData = {
    completedChars: JSON.parse(localStorage.getItem("dbd_completed_chars") || "[]"),
    usedPerks: JSON.parse(localStorage.getItem("dbd_used_perks") || "{}"),
    exportDate: new Date().toISOString(),
    version: "1.0"
  };

  const dataStr = JSON.stringify(progressData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `dbd-progress-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  // Cleanup
  URL.revokeObjectURL(link.href);
}

// Upload and restore progress data from JSON file
function uploadProgress() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const progressData = JSON.parse(e.target.result);
        
        // Validate the data structure
        if (!progressData.completedChars || !progressData.usedPerks) {
          alert('Invalid progress file format.');
          return;
        }
        
        // Confirm before overwriting
        let userConfirmed = true;
        try {
          userConfirmed = confirm('This will overwrite your current progress. Continue?');
        } catch (e) {
          userConfirmed = true;
        }
        
        if (!userConfirmed) return;
        
        // Restore the data
        localStorage.setItem("dbd_completed_chars", JSON.stringify(progressData.completedChars));
        localStorage.setItem("dbd_used_perks", JSON.stringify(progressData.usedPerks));
        
        // Refresh the UI instead of reloading the page
        if (typeof initCharacterList === 'function') {
          initCharacterList();
        }
        if (typeof renderSavedProgress === 'function') {
          renderSavedProgress();
        }
        if (typeof updateNavProgress === 'function') {
          updateNavProgress();
        }
        
        // Also update tierlist view if it's active
        if (typeof populateTierlistCharacters === 'function') {
          populateTierlistCharacters();
        }
        if (typeof populateTierlistPerks === 'function') {
          populateTierlistPerks();
        }
        
        // Update available perks for current page
        const currentPageType = getCurrentPageType();
        if (typeof updateAvailablePerks === 'function') {
          updateAvailablePerks(currentPageType);
        }
        
        alert('Progress restored successfully!');
        
      } catch (error) {
        alert('Error reading progress file. Please check the file format.');
        console.error('Upload error:', error);
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}
