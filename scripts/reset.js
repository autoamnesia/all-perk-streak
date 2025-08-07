// =============================================================================
// RESET AND MANAGEMENT FUNCTIONS
// =============================================================================

//Resets the entire progress on the side you currently on
function resetPageProgress() {
  const page = getCurrentPageType(); // "killers" or "survivors"
  
  // Try to show confirmation, but proceed if user has disabled dialogs
  let userConfirmed = true;
  try {
    userConfirmed = confirm(`Are you sure you want to reset all Completion Progress for ${page}? This will remove all Completion selections but keep Perks selected.`);
  } catch (e) {
    // If confirm() fails or is blocked, assume user wants to proceed
    userConfirmed = true;
  }
  
  if (!userConfirmed) {
    return;
  }
  let completedChars = JSON.parse(localStorage.getItem("dbd_completed_chars") || "[]");
  let changed = false;
  
  // Only reset completed characters for this page, keep perks
  const originalLength = completedChars.length;
  completedChars = completedChars.filter(charFile => {
    const isKiller = isKillerCharFile(charFile);
    if (page === "killers" && isKiller) {
      return false; // Remove killer characters from completed list
    } else if (page === "survivors" && !isKiller) {
      return false; // Remove survivor characters from completed list
    }
    return true; // Keep characters from other page
  });
  
  if (completedChars.length !== originalLength) {
    changed = true;
    localStorage.setItem("dbd_completed_chars", JSON.stringify(completedChars));
  }
  
  if (changed) {
    //alert(`Completed progress for ${page} is reset. Perks are kept.`);
  } else {
    //alert(`No completed progress for ${page} to reset.`);
  }
  selectedCharacter = null;
  const titleEl = document.getElementById("selected-perks-title");
  if (titleEl) titleEl.textContent = "Selected Perks";
  clearPerkSlots();
  initCharacterList();
  renderSavedProgress();
  updateCharacterBorders();
  
  // Also update tierlist view if it's active
  if (typeof populateTierlistCharacters === 'function') {
    populateTierlistCharacters();
  }
  if (typeof populateTierlistPerks === 'function') {
    populateTierlistPerks();
  }
  if (typeof updateNavProgress === 'function') {
    updateNavProgress();
  }
}

//Resets a picked character if accidently completed
function resetSelectedCharacter() {
  if (!selectedCharacter) {
    // Should rework this to not use alert and insted have a small notification
   // alert("No character chosen.");
    return;
  }
  
  let userConfirmed = true;
  try {
    userConfirmed = confirm(`Reset completion status for ${selectedCharacter.name}? This will remove the green border but keep perks.`);
  } catch (e) {
    // If confirm() fails or is blocked, assume user wants to proceed
    userConfirmed = true;
  }
  
  if (!userConfirmed) return;

  let completedChars = JSON.parse(localStorage.getItem("dbd_completed_chars") || "[]");
  let changed = false;
  
  if (completedChars.includes(selectedCharacter.file)) {
    completedChars = completedChars.filter(char => char !== selectedCharacter.file);
    changed = true;
  }
  
  if (changed) {
    localStorage.setItem("dbd_completed_chars", JSON.stringify(completedChars));
    //alert(`Completion status for ${selectedCharacter.name} is reset.`);
  } else {
    //alert(`${selectedCharacter.name} is not marked as completed.`);
  }

  // Don't clear perk slots or reset selectedCharacter - just update borders
  updateCharacterBorders();
  
  // Also update tierlist view if it's active
  if (typeof populateTierlistCharacters === 'function') {
    populateTierlistCharacters();
  }
  if (typeof updateNavProgress === 'function') {
    updateNavProgress();
  }
}

//Resets all perks on the current side but keeps completion status
function resetAll() {
  const page = getCurrentPageType(); // "killers" or "survivors"
  
  let userConfirmed = true;
  try {
    userConfirmed = confirm(`Are you sure you want to reset EVERYTHING for ${page}? This will remove all perk selections and reset completion progress.`);
  } catch (e) {
    // If confirm() fails or is blocked, assume user wants to proceed
    userConfirmed = true;
  }
  
  if (!userConfirmed) {
    return;
  }
  
  let usedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
  let completedChars = JSON.parse(localStorage.getItem("dbd_completed_chars") || "[]");
  let changed = false;
  
  // Reset perks for current page
  for (const charFile of Object.keys({...usedPerks})) {
    const isKiller = isKillerCharFile(charFile);
    if (page === "killers" && isKiller) {
      delete usedPerks[charFile];
      changed = true;
    } else if (page === "survivors" && !isKiller) {
      delete usedPerks[charFile];
      changed = true;
    }
  }
  
  // Reset completion status for current page
  const originalLength = completedChars.length;
  completedChars = completedChars.filter(charFile => {
    const isKiller = isKillerCharFile(charFile);
    if (page === "killers" && isKiller) {
      return false; // Remove killer characters from completed list
    } else if (page === "survivors" && !isKiller) {
      return false; // Remove survivor characters from completed list
    }
    return true; // Keep characters from other page
  });
  
  if (completedChars.length !== originalLength) {
    changed = true;
  }
  
  if (changed) {
    localStorage.setItem("dbd_used_perks", JSON.stringify(usedPerks));
    localStorage.setItem("dbd_completed_chars", JSON.stringify(completedChars));
  }
  
  selectedCharacter = null;
  const titleEl = document.getElementById("selected-perks-title");
  if (titleEl) titleEl.textContent = "Selected Perks";
  clearPerkSlots();
  initCharacterList();
  renderSavedProgress();
  updateAvailablePerks(page);
  
  // Also update tierlist view if it's active
  if (typeof populateTierlistCharacters === 'function') {
    populateTierlistCharacters();
  }
  if (typeof populateTierlistPerks === 'function') {
    populateTierlistPerks();
  }
  if (typeof updateNavProgress === 'function') {
    updateNavProgress();
  }
}

//Resets only perks on the current side but keeps completion status
function resetAllPerks() {
  const page = getCurrentPageType(); // "killers" or "survivors"
  
  let userConfirmed = true;
  try {
    userConfirmed = confirm(`Are you sure you want to reset all perks for ${page}? This will remove all perk selections but keep completion status.`);
  } catch (e) {
    // If confirm() fails or is blocked, assume user wants to proceed
    userConfirmed = true;
  }
  
  if (!userConfirmed) {
    return;
  }
  
  let usedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
  let changed = false;
  
  for (const charFile of Object.keys({...usedPerks})) {
    const isKiller = isKillerCharFile(charFile);
    if (page === "killers" && isKiller) {
      delete usedPerks[charFile];
      changed = true;
    } else if (page === "survivors" && !isKiller) {
      delete usedPerks[charFile];
      changed = true;
    }
  }
  
  if (changed) {
    localStorage.setItem("dbd_used_perks", JSON.stringify(usedPerks));
  }
  
  selectedCharacter = null;
  const titleEl = document.getElementById("selected-perks-title");
  if (titleEl) titleEl.textContent = "Selected Perks";
  clearPerkSlots();
  initCharacterList();
  renderSavedProgress();
  updateAvailablePerks(page);
  
  // Also update tierlist view if it's active
  if (typeof populateTierlistCharacters === 'function') {
    populateTierlistCharacters();
  }
  if (typeof populateTierlistPerks === 'function') {
    populateTierlistPerks();
  }
  if (typeof updateNavProgress === 'function') {
    updateNavProgress();
  }
}
