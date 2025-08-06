// =============================================================================
// TOGGLE FUNCTIONS AND SETTINGS
// =============================================================================

// Toggle show used perks state
function toggleShowUsedPerks() {
  showUsedPerks = !showUsedPerks;
  localStorage.setItem("dbd_show_used_perks", JSON.stringify(showUsedPerks));
  
  // Update the button appearance and text
  const toggleButton = document.getElementById("show-used-toggle");
  if (toggleButton) {
    toggleButton.textContent = showUsedPerks ? "👁️ Hide Used" : "👁️ Show Used";
    toggleButton.style.backgroundColor = showUsedPerks ? "#2196F3" : "#666";
    toggleButton.title = showUsedPerks ? 
      "Click to hide used perks" : 
      "Click to show used perks";
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
    lockButton.style.backgroundColor = perksLocked ? "#f44336" : "#4CAF50";
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
    toggleButton.style.backgroundColor = allowRemoveFromCompleted ? "#FF9800" : "#4CAF50";
    toggleButton.title = allowRemoveFromCompleted ? 
      "Click to protect perks assigned to completed characters" : 
      "Click to allow removing perks from completed characters";
  }
}
