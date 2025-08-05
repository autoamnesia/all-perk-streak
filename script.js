// Global variable to track which character is currently selected
let selectedCharacter = null;

// Store character data globally for type checking
let characterData = null;

// Utility function to check if the character is a killer based on actual data
function isKillerCharFile(charFile) {
  if (!characterData) return false;
  
  // Check if the character file exists in killers array
  return characterData.killers && characterData.killers.some(killer => killer.file === charFile);
}

// URL based checker to find what side you doing
function getCurrentPageType() {
  return location.pathname.includes("killer") ? "killers" : "survivors";
}

function filterPerks(searchTerm, type) {
  const perks = window.allPerks[type] || [];
  return perks.filter(perk => 
    perk.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

// Updates the list of available perks based on which side
function updateAvailablePerks(type) {
  const perkContainer = document.getElementById("available-perks");
  if (!perkContainer) return;

  const searchInput = document.getElementById("perk-search");
  const searchTerm = searchInput ? searchInput.value : "";
  
  const perks = searchTerm ? 
    filterPerks(searchTerm, type) : 
    window.allPerks[type] || [];

  perkContainer.innerHTML = "";

  const usedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");

  perks.forEach(perk => {
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.display = "inline-block";
    wrapper.style.margin = "4px";

    const img = document.createElement("img");
    img.src = `assets/perks/${type}/${perk.file}`;
    img.alt = perk.name;
    img.title = perk.name;
    img.className = "perk-icon";

    let usedByChar = null;
    for (const [charFile, perksList] of Object.entries(usedPerks)) {
      if (perksList.includes(perk.file)) {
        usedByChar = charFile;
        break;
      }
    }

    if (usedByChar) {
      img.style.opacity = "1";
      img.style.pointerEvents = "none";

      const charType = isKillerCharFile(usedByChar) ? "killers" : "survivors";
      const charIcon = document.createElement("img");
      charIcon.src = `assets/characters/${charType}/${usedByChar}.webp`;
      charIcon.style.position = "absolute";
      charIcon.style.width = "60px";
      charIcon.style.height = "60px";
      charIcon.style.bottom = "0";
      charIcon.style.left = "0";
      charIcon.title = usedByChar;
      wrapper.appendChild(charIcon);
    } else {
      img.style.opacity = "1";
      img.style.pointerEvents = "auto";
      img.onclick = () => selectPerk(perk.file);
    }

    wrapper.appendChild(img);
    perkContainer.appendChild(wrapper);
  });
}

// Renders characters
function renderCharacters(characters, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";
  const completedChars = JSON.parse(localStorage.getItem("dbd_completed_chars") || "[]");

  characters.forEach(character => {
    const card = document.createElement("div");
    card.classList.add("character-card");

    const img = document.createElement("img");
    img.src = `assets/characters/${character.type}/${character.file}.webp`;
    img.alt = character.name;

    if (completedChars.includes(character.file)) {
      img.style.border = "3px solid limegreen";
      img.dataset.locked = "true";
    } else {
      img.style.border = "2px solid transparent";
      img.dataset.locked = "";
    }

    const name = document.createElement("div");
    name.className = "character-name";
    name.textContent = character.name;

    img.addEventListener("click", () => {
      // Clear other borders
      document.querySelectorAll(".character-list img").forEach(el => {
        if (el.dataset.locked === "true") {
          el.style.border = "3px solid limegreen";
        } else {
          el.style.border = "2px solid transparent";
        }
      });

      selectedCharacter = character;
      img.style.border = "2px solid dodgerblue";

      // Update title
      const titleEl = document.getElementById("selected-perks-title");
      if (titleEl) {
        titleEl.textContent = `Selected Perks For ${character.name}`;
      }

      // Get fresh perks data from localStorage
      const currentUsedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
      const perksForChar = currentUsedPerks[character.file] || [];

      if (perksForChar.length > 0) {
        populatePerkSlots(perksForChar);
      } else {
        clearPerkSlots();
      }

      updateAvailablePerks(character.type);
      renderSavedProgress();
    });

    // Right-click to toggle completion status
    img.addEventListener("contextmenu", (e) => {
      e.preventDefault(); // Prevent default context menu
      
      let completedChars = JSON.parse(localStorage.getItem("dbd_completed_chars") || "[]");
      const isCompleted = completedChars.includes(character.file);
      
      if (isCompleted) {
        // Remove from completed
        completedChars = completedChars.filter(char => char !== character.file);
        localStorage.setItem("dbd_completed_chars", JSON.stringify(completedChars));
      } else {
        // Add to completed
        completedChars.push(character.file);
        localStorage.setItem("dbd_completed_chars", JSON.stringify(completedChars));
      }
      
      updateCharacterBorders();
    });

    // Mobile long press to toggle completion status
    let touchTimer = null;
    let touchMoved = false;
    
    img.addEventListener("touchstart", (e) => {
      touchMoved = false;
      touchTimer = setTimeout(() => {
        // Long press detected
        let completedChars = JSON.parse(localStorage.getItem("dbd_completed_chars") || "[]");
        const isCompleted = completedChars.includes(character.file);
        
        if (isCompleted) {
          // Remove from completed
          completedChars = completedChars.filter(char => char !== character.file);
          localStorage.setItem("dbd_completed_chars", JSON.stringify(completedChars));
        } else {
          // Add to completed
          completedChars.push(character.file);
          localStorage.setItem("dbd_completed_chars", JSON.stringify(completedChars));
        }
        
        updateCharacterBorders();
        
        // Provide haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }, 500); // 500ms long press
    });
    
    img.addEventListener("touchmove", () => {
      touchMoved = true;
      if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
      }
    });
    
    img.addEventListener("touchend", () => {
      if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
      }
    });

    img.addEventListener("touchcancel", () => {
      if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
      }
    });

    card.appendChild(img);
    card.appendChild(name);
    container.appendChild(card);
  });
}

//Fills the perk slots
function populatePerkSlots(perkFiles) {
  if (!selectedCharacter) return;

  const slots = document.querySelectorAll(".perk-slot");
  slots.forEach((slot, index) => {
    slot.innerHTML = "";
    if (perkFiles[index]) {
      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      wrapper.style.display = "inline-block";

      const perkImg = document.createElement("img");
      perkImg.src = `assets/perks/${selectedCharacter.type}/${perkFiles[index]}`;
      perkImg.classList.add("perk-icon");

      const charIcon = document.createElement("img");
      charIcon.src = `assets/characters/${selectedCharacter.type}/${selectedCharacter.file}.webp`;
      charIcon.style.position = "absolute";
      charIcon.style.width = "16px";
      charIcon.style.height = "16px";
      charIcon.style.bottom = "0";
      charIcon.style.left = "0";
      charIcon.style.borderRadius = "50%";
      charIcon.style.border = "1px solid #fff";
      charIcon.title = selectedCharacter.name;

      wrapper.appendChild(perkImg);
      wrapper.appendChild(charIcon);

      wrapper.addEventListener("click", () => {
        slot.innerHTML = "";
        // Auto-save when removing perk from slot
        saveCurrentPerks();
      });

      slot.appendChild(wrapper);
    }
  });
}

//Clears the perk slots
function clearPerkSlots() {
  document.querySelectorAll(".perk-slot").forEach(slot => slot.innerHTML = "");
}

//Saves perks
function saveUsedPerks(characterFile, perkFiles) {
  let usedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
  usedPerks[characterFile] = perkFiles;
  localStorage.setItem("dbd_used_perks", JSON.stringify(usedPerks));
}

//Updates character borders to reflect completion status in real-time
function updateCharacterBorders() {
  const usedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
  const completedChars = JSON.parse(localStorage.getItem("dbd_completed_chars") || "[]");
  
  document.querySelectorAll(".character-list img").forEach(img => {
    const characterFile = img.src.split("/").pop().replace(".webp", "");
    const isCompleted = completedChars.includes(characterFile);
    const isSelected = selectedCharacter && selectedCharacter.file === characterFile;
    
    if (isCompleted && isSelected) {
      // Both completed and selected - show green with blue inner border
      img.style.border = "4px solid limegreen";
      img.style.boxShadow = "inset 0 0 0 2px dodgerblue";
      img.dataset.locked = "true";
    } else if (isCompleted) {
      // Just completed
      img.style.border = "3px solid limegreen";
      img.style.boxShadow = "none";
      img.dataset.locked = "true";
    } else if (isSelected) {
      // Just selected
      img.style.border = "2px solid dodgerblue";
      img.style.boxShadow = "none";
      img.dataset.locked = "";
    } else {
      // Default state
      img.style.border = "2px solid transparent";
      img.style.boxShadow = "none";
      img.dataset.locked = "";
    }
  });
  
  // Update navigation progress bars when completion status changes
  updateNavProgress();
}

//Saves currently selected perks for the selected character
function saveCurrentPerks() {
  if (!selectedCharacter) return;
  
  const selectedPerks = [];
  document.querySelectorAll(".perk-slot div img.perk-icon").forEach(img => {
    if (img && img.src) {
      const fileName = img.src.split("/").pop();
      selectedPerks.push(fileName);
    }
  });
  
  saveUsedPerks(selectedCharacter.file, selectedPerks);
  
  // Update the available perks list to reflect the changes
  updateAvailablePerks(selectedCharacter.type);
  renderSavedProgress();
}

//Checks which perks are used
function isPerkUsed(perkFile) {
  let usedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
  return Object.values(usedPerks).some(perks => perks.includes(perkFile));
}

//Select perks
function selectPerk(perkFile) {
  if (!selectedCharacter) {
    //alert("Pick a character.");
    return;
  }

  if (isPerkUsed(perkFile)) {
    alert("This perk is already used.");
    return;
  }

  const slots = document.querySelectorAll(".perk-slot");

  for (let slot of slots) {
    const imgWrapper = slot.querySelector("div");
    if (imgWrapper) {
      const img = imgWrapper.querySelector("img.perk-icon");
      if (img && img.src.endsWith(perkFile)) {
        slot.innerHTML = "";
        // Auto-save when removing perk
        saveCurrentPerks();
        return;
      }
    }
  }

  for (let slot of slots) {
    if (slot.children.length === 0) {
      const img = document.createElement("img");
      img.src = `assets/perks/${selectedCharacter.type}/${perkFile}`;
      img.classList.add("perk-icon");

      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      wrapper.style.display = "inline-block";

      const charIcon = document.createElement("img");
      charIcon.src = `assets/characters/${selectedCharacter.type}/${selectedCharacter.file}.webp`;
      charIcon.style.position = "absolute";
      charIcon.style.width = "16px";
      charIcon.style.height = "16px";
      charIcon.style.bottom = "0";
      charIcon.style.left = "0";
      charIcon.style.borderRadius = "50%";
      charIcon.style.border = "1px solid #fff";
      charIcon.title = selectedCharacter.name;

      wrapper.appendChild(img);
      wrapper.appendChild(charIcon);

      wrapper.addEventListener("click", () => {
        slot.innerHTML = "";
        // Auto-save when removing perk
        saveCurrentPerks();
      });

      slot.appendChild(wrapper);
      // Auto-save when adding perk
      saveCurrentPerks();
      break;
    }
  }
}

//Function to complete character selection and clear slots
function markCharacterCompleted() {
  if (!selectedCharacter) {
    //alert("No character chosen.");
    showPopup()
    return;
  }

  // Mark character as completed
  let completedChars = JSON.parse(localStorage.getItem("dbd_completed_chars") || "[]");
  if (!completedChars.includes(selectedCharacter.file)) {
    completedChars.push(selectedCharacter.file);
    localStorage.setItem("dbd_completed_chars", JSON.stringify(completedChars));
  }

  //alert("Character completed and progress saved!");
  updateCharacterBorders();
}

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
}

//Render to see what is saved
function renderSavedProgress() {
  const container = document.getElementById("saved-progress");
  if (!container) return;
  container.innerHTML = "";

  let usedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
  if (Object.keys(usedPerks).length === 0) {
    container.textContent = "No saved progress.";
    return;
  }

  for (const [charFile, perks] of Object.entries(usedPerks)) {
    const charDiv = document.createElement("div");
    charDiv.classList.add("saved-character");
    charDiv.style.display = "flex";
    charDiv.style.alignItems = "center";
    charDiv.style.marginBottom = "10px";

    let type = isKillerCharFile(charFile) ? "killers" : "survivors";

    const charImg = document.createElement("img");
    charImg.src = `assets/characters/${type}/${charFile}.webp`;
    charImg.alt = charFile;
    charImg.style.width = "80px";
    charImg.style.height = "80px";
    charImg.style.marginRight = "10px";

    charDiv.appendChild(charImg);

    const perksDiv = document.createElement("div");
    perksDiv.classList.add("saved-perks");
    perks.forEach(perkFile => {
      const perkImg = document.createElement("img");
      perkImg.src = `assets/perks/${type}/${perkFile}`;
      perkImg.alt = perkFile;
      perkImg.title = perkFile;
      perkImg.style.width = "40px";
      perkImg.style.height = "40px";
      perkImg.style.marginRight = "5px";
      perksDiv.appendChild(perkImg);
    });

    charDiv.appendChild(perksDiv);
    container.appendChild(charDiv);
  }
}

async function initCharacterList() {
  const res = await fetch("characters.json");
  const data = await res.json();
  window.allPerks = data.perks;
  
  // Store character data globally for type checking
  characterData = data;

  const page = getCurrentPageType();
  if (page === "survivors") {
    renderCharacters(data.survivors, "survivor-list");
  } else {
    renderCharacters(data.killers, "killer-list");
  }
  updateAvailablePerks(page);
  
  // Update navigation progress bars
  updateNavProgress(data);
}

// Function to update navigation progress bars
async function updateNavProgress(data) {
  if (!data) {
    const res = await fetch("characters.json");
    data = await res.json();
  }
  
  const completedChars = JSON.parse(localStorage.getItem("dbd_completed_chars") || "[]");
  
  // Clean up invalid completed characters
  const validKillerFiles = data.killers ? data.killers.map(k => k.file) : [];
  const validSurvivorFiles = data.survivors ? data.survivors.map(s => s.file) : [];
  const allValidFiles = [...validKillerFiles, ...validSurvivorFiles];
  
  // Filter out any invalid character files
  const validCompletedChars = completedChars.filter(charFile => allValidFiles.includes(charFile));
  
  // Update localStorage if we found invalid entries
  if (validCompletedChars.length !== completedChars.length) {
    localStorage.setItem("dbd_completed_chars", JSON.stringify(validCompletedChars));
  }
  
  // Count completed killers and survivors using valid data
  let completedKillers = 0;
  let completedSurvivors = 0;
  
  validCompletedChars.forEach(charFile => {
    if (validKillerFiles.includes(charFile)) {
      completedKillers++;
    } else if (validSurvivorFiles.includes(charFile)) {
      completedSurvivors++;
    }
  });
  
  const totalKillers = data.killers ? data.killers.length : 0;
  const totalSurvivors = data.survivors ? data.survivors.length : 0;
  
  // Ensure completed counts don't exceed totals
  completedKillers = Math.min(completedKillers, totalKillers);
  completedSurvivors = Math.min(completedSurvivors, totalSurvivors);
  
  // Update main progress bar based on current page
  const currentPage = getCurrentPageType();
  const mainProgressBar = document.getElementById("main-progress-bar");
  const mainProgressText = document.getElementById("main-progress-text");
  
  if (mainProgressBar && mainProgressText) {
    if (currentPage === "killers") {
      const killersPercentage = totalKillers > 0 ? (completedKillers / totalKillers) * 100 : 0;
      mainProgressBar.style.width = `${killersPercentage}%`;
      mainProgressText.textContent = `${completedKillers}/${totalKillers} Completed`;
    } else {
      const survivorsPercentage = totalSurvivors > 0 ? (completedSurvivors / totalSurvivors) * 100 : 0;
      mainProgressBar.style.width = `${survivorsPercentage}%`;
      mainProgressText.textContent = `${completedSurvivors}/${totalSurvivors} Completed`;
    }
  }
  
  // Update killers progress in nav (shown on survivors page)
  const navKillersCounter = document.getElementById("nav-killers-counter");
  const navKillersProgress = document.getElementById("nav-killers-progress");
  
  if (navKillersCounter && navKillersProgress) {
    navKillersCounter.textContent = `${completedKillers}/${totalKillers}`;
    const killersPercentage = totalKillers > 0 ? (completedKillers / totalKillers) * 100 : 0;
    navKillersProgress.style.width = `${killersPercentage}%`;
  }
  
  // Update survivors progress in nav (shown on killers page)
  const navSurvivorsCounter = document.getElementById("nav-survivors-counter");
  const navSurvivorsProgress = document.getElementById("nav-survivors-progress");
  
  if (navSurvivorsCounter && navSurvivorsProgress) {
    navSurvivorsCounter.textContent = `${completedSurvivors}/${totalSurvivors}`;
    const survivorsPercentage = totalSurvivors > 0 ? (completedSurvivors / totalSurvivors) * 100 : 0;
    navSurvivorsProgress.style.width = `${survivorsPercentage}%`;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  initCharacterList();
  renderSavedProgress();

  const controls = document.getElementById("controls");
  if (!controls) return;
  controls.innerHTML = "";

  const btnResetAllPerks = document.createElement("button");
  btnResetAllPerks.textContent = "Reset All";
  btnResetAllPerks.style.padding = "10px";
  btnResetAllPerks.style.margin = "10px 5px 10px 0";
  btnResetAllPerks.addEventListener("click", resetAll);

  const btnResetPage = document.createElement("button");
  btnResetPage.textContent = "Reset Streak Progress";
  btnResetPage.style.padding = "10px";
  btnResetPage.style.margin = "10px 5px 10px 0";
  btnResetPage.addEventListener("click", resetPageProgress);

  const btnResetPerks = document.createElement("button");
  btnResetPerks.textContent = "Reset Perks";
  btnResetPerks.style.padding = "10px";
  btnResetPerks.style.margin = "10px 5px 10px 0";
  btnResetPerks.addEventListener("click", resetAllPerks);

  controls.appendChild(btnResetPage);
  controls.appendChild(btnResetPerks);
  controls.appendChild(btnResetAllPerks);

  const searchInput = document.getElementById("perk-search");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      if (selectedCharacter) {
        updateAvailablePerks(selectedCharacter.type);
      } else {
        updateAvailablePerks(getCurrentPageType());
      }
    });
  }
});

