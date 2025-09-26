// =============================================================================
// TOGGLE FUNCTIONS AND SETTINGS
// =============================================================================

// Toggle show used perks mode (cycles through 3 states)
function toggleShowUsedPerks() {
  // Cycle through: 0 = show all, 1 = hide used, 2 = hide completed
  showUsedPerksMode = (showUsedPerksMode + 1) % 3;
  localStorage.setItem("dbd_show_used_perks_mode", showUsedPerksMode.toString());
  
  // Update the button appearance and text
  const toggleButton = document.getElementById("show-used-toggle");
  if (toggleButton) {
    switch (showUsedPerksMode) {
      case 0: // Show all
        toggleButton.textContent = "👁️ Show All";
        toggleButton.style.backgroundColor = "#4CAF50";
        toggleButton.title = "Showing all perks. Click to hide used perks.";
        break;
      case 1: // Hide used
        toggleButton.textContent = "🙈 Hide Used";
        toggleButton.style.backgroundColor = "#666";
        toggleButton.title = "Hiding used perks. Click to hide only completed perks.";
        break;
      case 2: // Hide completed
        toggleButton.textContent = "🏆 Hide Completed";
        toggleButton.style.backgroundColor = "#FF9800";
        toggleButton.title = "Hiding perks used by completed characters. Click to show all perks.";
        break;
    }
  }
  
  // Refresh available perks to update visibility
  if (selectedCharacter) {
    updateAvailablePerks(selectedCharacter.type);
  } else {
    updateAvailablePerks(getCurrentPageType());
  }
}

// Toggle perk lock state
function togglePerkLock() {
  perksLocked = !perksLocked;
  localStorage.setItem("dbd_perks_locked", JSON.stringify(perksLocked));
  
  // Update the button appearance and text
  const lockButton = document.getElementById("perk-lock-toggle");
  if (lockButton) {
    lockButton.textContent = perksLocked ? "🔒 Unlock Perks" : "🔓 Lock Perks";
    lockButton.className = perksLocked ? "control-button danger" : "control-button success";
    lockButton.title = perksLocked ? 
      "Click to unlock perks (allows reassigning used perks)" : 
      "Click to lock perks (prevents reassigning used perks)";
  }
  
  // Refresh available perks to update interaction behavior
  if (selectedCharacter) {
    updateAvailablePerks(selectedCharacter.type);
  } else {
    updateAvailablePerks(getCurrentPageType());
  }
}

// Toggle allow remove from completed state
function toggleAllowRemoveFromCompleted() {
  allowRemoveFromCompleted = !allowRemoveFromCompleted;
  localStorage.setItem("dbd_allow_remove_completed", JSON.stringify(allowRemoveFromCompleted));
  
  // Update the button appearance and text
  const toggleButton = document.getElementById("allow-remove-completed-toggle");
  if (toggleButton) {
    toggleButton.textContent = allowRemoveFromCompleted ? "🔓 Allow Remove from Completed" : "🔒 Protect Completed";
    toggleButton.className = allowRemoveFromCompleted ? "control-button toggle-active" : "control-button success";
    toggleButton.title = allowRemoveFromCompleted ? 
      "Click to protect perks assigned to completed characters" : 
      "Click to allow removing perks from completed characters";
  }
}

// Toggle show completed characters state
function toggleShowCompleted() {
  showCompleted = !showCompleted;
  localStorage.setItem("dbd_show_completed", JSON.stringify(showCompleted));
  
  // Update the button appearance and text
  const toggleButton = document.getElementById("show-completed-toggle");
  if (toggleButton) {
    toggleButton.textContent = showCompleted ? "🏆 Hide Completed" : "🏆 Show Completed";
    toggleButton.className = showCompleted ? "control-button toggle-active" : "control-button toggle-inactive";
    toggleButton.title = showCompleted ? 
      "Click to hide completed characters" : 
      "Click to show completed characters";
  }
  
  // Refresh character list to update visibility
  initCharacterList();
  
  // Also refresh tierlist if in tierlist view
  if (typeof refreshTierlist === 'function') {
    refreshTierlist();
  }
}

// Toggle colorful perks background state
function toggleColorfulPerks() {
  colorfulPerks = !colorfulPerks;
  localStorage.setItem("dbd_colorful_perks", JSON.stringify(colorfulPerks));
  
  // Update the button appearance and text
  const toggleButton = document.getElementById("colorful-perks-toggle");
  if (toggleButton) {
    toggleButton.textContent = colorfulPerks ? "🎨 Colorful Perks" : "🖤 Simple Perks";
    toggleButton.className = colorfulPerks ? "control-button toggle-active" : "control-button success";
    toggleButton.title = colorfulPerks ? 
      "Click to disable colorful perk backgrounds" : 
      "Click to enable colorful perk backgrounds";
  }
  
  // Update CSS class on body to trigger style changes
  if (colorfulPerks) {
    document.body.classList.add('colorful-perks');
  } else {
    document.body.classList.remove('colorful-perks');
  }
  
  // Refresh available perks to update appearance
  if (selectedCharacter) {
    updateAvailablePerks(selectedCharacter.type);
  } else {
    updateAvailablePerks(getCurrentPageType());
  }
  
  // Also refresh tierlist if in tierlist view
  if (typeof refreshTierlist === 'function') {
    refreshTierlist();
  }
}
