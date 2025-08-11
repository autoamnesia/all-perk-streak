// =============================================================================
// TIERLIST VIEW FUNCTIONALITY
// =============================================================================

// Global variable to track current view mode
let currentView = "normal";

// Initialize tierlist functionality
function initTierlist() {
  // Get current view from localStorage or default to normal
  currentView = localStorage.getItem("dbd_view_mode") || "normal";
  
  const viewToggleBtn = document.getElementById("view-toggle-btn");
  
  if (viewToggleBtn) {
    // Only add event listener if it doesn't already have one
    if (!viewToggleBtn.hasAttribute('data-listener-added')) {
      viewToggleBtn.addEventListener("click", toggleView);
      viewToggleBtn.setAttribute('data-listener-added', 'true');
    }
    updateViewToggleButton();
  }
  
  // Set initial view
  if (currentView === "tierlist") {
    showTierlistView();
  } else {
    showNormalView();
  }
}

// Toggle between normal and tierlist view
function toggleView() {
  if (currentView === "normal") {
    currentView = "tierlist";
    showTierlistView();
  } else {
    currentView = "normal";
    showNormalView();
  }
  
  localStorage.setItem("dbd_view_mode", currentView);
  updateViewToggleButton();
}

// Update the view toggle button text and appearance
function updateViewToggleButton() {
  const viewToggleBtn = document.getElementById("view-toggle-btn");
  if (viewToggleBtn) {
    if (currentView === "normal") {
      viewToggleBtn.textContent = "📋 Switch to Tierlist View";
      viewToggleBtn.title = "Switch to tierlist view for drag-and-drop perk assignment";
    } else {
      viewToggleBtn.textContent = "📄 Switch to Normal View";
      viewToggleBtn.title = "Switch to normal view for character selection";
    }
  }
}

// Show normal view and hide tierlist view
function showNormalView() {
  const normalView = document.getElementById("normal-view");
  const tierlistView = document.getElementById("tierlist-view");
  const perkSelectionArea = document.getElementById("perk-selection-area");
  
  if (normalView) normalView.style.display = "block";
  if (tierlistView) tierlistView.style.display = "none";
  if (perkSelectionArea) perkSelectionArea.style.display = "block";
  
  // Refresh the normal view to update completion status and character list
  if (typeof initCharacterList === 'function') {
    initCharacterList();
  }
  if (typeof renderSavedProgress === 'function') {
    renderSavedProgress();
  }
}

// Show tierlist view and hide normal view
function showTierlistView() {
  const normalView = document.getElementById("normal-view");
  const tierlistView = document.getElementById("tierlist-view");
  const perkSelectionArea = document.getElementById("perk-selection-area");
  
  if (normalView) normalView.style.display = "none";
  if (tierlistView) tierlistView.style.display = "block";
  
  // Hide the normal perk selection area since we have a new one in tierlist
  if (perkSelectionArea) perkSelectionArea.style.display = "none";
  
  // Wait for character data to be loaded before initializing
  if (characterData && window.allPerks) {
    // Initialize tierlist with current characters and perks
    populateTierlistCharacters();
    populateTierlistPerks();
    initializeTierlistDragAndDrop();
  } else {
    // If data isn't loaded yet, wait for it with multiple attempts
    let attempts = 0;
    const maxAttempts = 20; // Wait up to 2 seconds (20 * 100ms)
    
    const waitForData = () => {
      if (characterData && window.allPerks) {
        populateTierlistCharacters();
        populateTierlistPerks();
        initializeTierlistDragAndDrop();
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(waitForData, 100);
      } else {
        console.warn('Character data failed to load for tierlist view');
      }
    };
    
    setTimeout(waitForData, 100);
  }
}

// Populate characters in the tierlist view
function populateTierlistCharacters() {
  const characterList = document.getElementById("tierlist-character-list");
  if (!characterList || !characterData) return;
  
  const currentPageType = getCurrentPageType();
  const characters = characterData[currentPageType] || [];
  const completedChars = JSON.parse(localStorage.getItem("dbd_completed_chars") || "[]");
  const usedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
  
  // Get custom character order if it exists
  const characterOrder = JSON.parse(localStorage.getItem(`dbd_character_order_${currentPageType}`) || "[]");
  
  characterList.innerHTML = "";
  
  // Sort characters according to custom order, fallback to original order
  let sortedCharacters = [...characters];
  if (characterOrder.length > 0) {
    sortedCharacters.sort((a, b) => {
      const indexA = characterOrder.indexOf(a.file);
      const indexB = characterOrder.indexOf(b.file);
      
      // If both characters are in the custom order, sort by their custom position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only one is in custom order, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      // If neither is in custom order, maintain original order
      return 0;
    });
  }
  
  // Filter characters based on showCompleted toggle
  const charactersToShow = showCompleted ? 
    sortedCharacters : 
    sortedCharacters.filter(character => !completedChars.includes(character.file));
  
  charactersToShow.forEach(character => {
    const characterCard = createTierlistCharacterCard(character, completedChars, usedPerks);
    characterList.appendChild(characterCard);
  });
}

// Create a character card for the tierlist
function createTierlistCharacterCard(character, completedChars, usedPerks) {
  const isCompleted = completedChars.includes(character.file);
  const characterPerks = usedPerks[character.file] || [];
  
  const card = document.createElement("div");
  card.className = "tierlist-character-card";
  card.dataset.characterFile = character.file;
  
  if (isCompleted) {
    card.classList.add("completed");
  }
  
  // Don't add selection highlighting in tierlist mode since it doesn't serve a purpose
  
  const img = document.createElement("img");
  img.src = `assets/characters/${character.type}/${character.file}.webp`;
  img.alt = character.name;
  img.draggable = false; // Prevent image drag interference
  
  const info = document.createElement("div");
  info.className = "tierlist-character-info";
  
  const name = document.createElement("div");
  name.className = "tierlist-character-name";
  name.textContent = character.name;
  
  const perkCount = document.createElement("div");
  perkCount.className = "tierlist-character-perk-count";
  perkCount.textContent = `${characterPerks.length}/4 perks`;
  
  info.appendChild(name);
  info.appendChild(perkCount);
  
  // Add mini perk icons if character has perks
  if (characterPerks.length > 0) {
    const perksDiv = document.createElement("div");
    perksDiv.className = "tierlist-character-perks";
    
    characterPerks.forEach(perkFile => {
      const miniPerk = document.createElement("img");
      miniPerk.className = "tierlist-mini-perk";
      miniPerk.src = `assets/perks/${character.type}/${perkFile}`;
      miniPerk.title = perkFile.replace('.webp', '').replace(/-/g, ' ');
      miniPerk.draggable = true;
      miniPerk.dataset.perkFile = perkFile;
      miniPerk.dataset.characterFile = character.file;
      
      // Add drag event listeners to mini perks
      miniPerk.addEventListener("dragstart", handleMiniPerkDragStart);
      miniPerk.addEventListener("dragend", handleMiniPerkDragEnd);
      
      perksDiv.appendChild(miniPerk);
    });
    
    info.appendChild(perksDiv);
  }
  
  card.appendChild(img);
  card.appendChild(info);

  // Add click event to select character (same as normal view)
  card.addEventListener("click", () => {
    selectedCharacter = character;
    
    // Update all character borders properly
    populateTierlistCharacters(); // Refresh to show selection
    
    // Update title in normal view area (if it exists)
    const titleEl = document.getElementById("selected-perks-title");
    if (titleEl) {
      titleEl.textContent = `Selected Perks For ${character.name}`;
    }
    
    // Get fresh perks data from localStorage
    const currentUsedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
    const perksForChar = currentUsedPerks[character.file] || [];

    if (perksForChar.length > 0 && typeof populatePerkSlots === 'function') {
      populatePerkSlots(perksForChar);
    } else if (typeof clearPerkSlots === 'function') {
      clearPerkSlots();
    }

    if (typeof updateAvailablePerks === 'function') {
      updateAvailablePerks(character.type);
    }
    if (typeof renderSavedProgress === 'function') {
      renderSavedProgress();
    }
  });
  
  // Add right-click functionality to toggle completion (same as normal view)
  card.addEventListener("contextmenu", (e) => {
    e.preventDefault(); // Prevent default context menu

    let completedChars = JSON.parse(localStorage.getItem("dbd_completed_chars") || "[]");
    const isCompleted = completedChars.includes(character.file);
    
    if (isCompleted) {
      // Remove from completed
      completedChars = completedChars.filter(char => char !== character.file);
      localStorage.setItem("dbd_completed_chars", JSON.stringify(completedChars));
    } else {
      // Add to completed and select the character
      completedChars.push(character.file);
      localStorage.setItem("dbd_completed_chars", JSON.stringify(completedChars));
      
      // Select the character when marking as completed
      selectedCharacter = character;
      
      // Update title
      const titleEl = document.getElementById("selected-perks-title");
      if (titleEl) {
        titleEl.textContent = `Selected Perks For ${character.name}`;
      }
      
      // Get fresh perks data and update UI
      const currentUsedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
      const perksForChar = currentUsedPerks[character.file] || [];

      if (perksForChar.length > 0 && typeof populatePerkSlots === 'function') {
        populatePerkSlots(perksForChar);
      } else if (typeof clearPerkSlots === 'function') {
        clearPerkSlots();
      }

      if (typeof updateAvailablePerks === 'function') {
        updateAvailablePerks(character.type);
      }
    }
    
    // Refresh displays
    populateTierlistCharacters();
    if (typeof renderSavedProgress === 'function') {
      renderSavedProgress();
    }
    if (typeof updateNavProgress === 'function') {
      updateNavProgress();
    }
  });
  
  // Add drag-over effects for perk dropping
  card.addEventListener("dragover", handleCharacterDragOver);
  card.addEventListener("drop", handleCharacterDrop);
  card.addEventListener("dragenter", handleCharacterDragEnter);
  card.addEventListener("dragleave", handleCharacterDragLeave);
  
  return card;
}

// Populate perks in the tierlist view
function populateTierlistPerks() {
  const perkContainer = document.getElementById("tierlist-available-perks");
  if (!perkContainer) return;

  const currentPageType = getCurrentPageType();
  const searchInput = document.getElementById("tierlist-perk-search");
  const searchTerm = searchInput ? searchInput.value : "";
  
  const perks = searchTerm ? 
    filterPerks(searchTerm, currentPageType) : 
    window.allPerks[currentPageType] || [];

  perkContainer.innerHTML = "";

  const usedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");

  perks.forEach(perk => {
    // Check if perk is used
    let usedByChar = null;
    for (const [charFile, perksList] of Object.entries(usedPerks)) {
      if (perksList.includes(perk.file)) {
        usedByChar = charFile;
        break;
      }
    }

    // In tierlist view, always hide perks that are assigned to characters
    // (they'll show up as mini perks on the character cards instead)
    if (usedByChar) {
      return; // Skip used perks completely in tierlist view
    }

    const perkItem = document.createElement("div");
    perkItem.className = "tierlist-perk-item";
    perkItem.draggable = true;
    perkItem.dataset.perkFile = perk.file;
    
    const img = document.createElement("img");
    img.src = `assets/perks/${currentPageType}/${perk.file}`;
    img.alt = perk.name;
    img.title = perk.name;
    img.draggable = false; // Prevent image drag interference
    
    perkItem.appendChild(img);
    perkContainer.appendChild(perkItem);
    
    // Add drag event listeners
    perkItem.addEventListener("dragstart", handlePerkDragStart);
    perkItem.addEventListener("dragend", handlePerkDragEnd);
  });
  
  // Add search functionality
  if (searchInput && !searchInput.hasAttribute('data-listener-added')) {
    searchInput.addEventListener("input", populateTierlistPerks);
    searchInput.setAttribute('data-listener-added', 'true');
  }
  
  // Add drop zone functionality to perk list
  perkContainer.addEventListener("dragover", handlePerkListDragOver);
  perkContainer.addEventListener("drop", handlePerkListDrop);
  perkContainer.addEventListener("dragenter", handlePerkListDragEnter);
  perkContainer.addEventListener("dragleave", handlePerkListDragLeave);
}

// Initialize drag and drop for tierlist
function initializeTierlistDragAndDrop() {
  console.log('🔧 Initializing tierlist drag and drop...');
  
  // Check browser drag and drop support
  if (!('draggable' in document.createElement('div'))) {
    console.error('❌ Drag and drop not supported in this browser');
    return;
  }
  
  // Force reinitialization of all drag and drop elements
  setupDragAndDropElements();
  console.log('✅ Drag and drop initialized');
}

// Setup all drag and drop elements
function setupDragAndDropElements() {
  // Setup character cards as drop zones
  const characterCards = document.querySelectorAll('.tierlist-character-card');
  characterCards.forEach(card => {
    // Remove existing listeners to avoid duplicates
    card.removeEventListener("dragover", handleCharacterDragOver);
    card.removeEventListener("drop", handleCharacterDrop);
    card.removeEventListener("dragenter", handleCharacterDragEnter);
    card.removeEventListener("dragleave", handleCharacterDragLeave);
    
    // Add fresh listeners
    card.addEventListener("dragover", handleCharacterDragOver);
    card.addEventListener("drop", handleCharacterDrop);
    card.addEventListener("dragenter", handleCharacterDragEnter);
    card.addEventListener("dragleave", handleCharacterDragLeave);
    
    console.log('🎯 Setup drop zone for:', card.dataset.characterFile);
  });
  
  // Setup perk items as draggable
  const perkItems = document.querySelectorAll('.tierlist-perk-item');
  console.log(`🔍 Found ${perkItems.length} perk items to make draggable`);
  perkItems.forEach(perk => {
    perk.draggable = true;
    
    // Force draggable attribute in DOM
    perk.setAttribute('draggable', 'true');
    
    // Remove existing listeners
    perk.removeEventListener("dragstart", handlePerkDragStart);
    perk.removeEventListener("dragend", handlePerkDragEnd);
    
    // Add fresh listeners
    perk.addEventListener("dragstart", handlePerkDragStart);
    perk.addEventListener("dragend", handlePerkDragEnd);
    
    console.log('🚀 Setup draggable perk:', perk.dataset.perkFile, 'draggable =', perk.draggable);
  });
  
  // Setup mini perks as draggable
  const miniPerks = document.querySelectorAll('.tierlist-mini-perk');
  miniPerks.forEach(miniPerk => {
    miniPerk.draggable = true;
    
    // Remove existing listeners
    miniPerk.removeEventListener("dragstart", handleMiniPerkDragStart);
    miniPerk.removeEventListener("dragend", handleMiniPerkDragEnd);
    
    // Add fresh listeners
    miniPerk.addEventListener("dragstart", handleMiniPerkDragStart);
    miniPerk.addEventListener("dragend", handleMiniPerkDragEnd);
  });
  
  // Setup perk list as drop zone
  const perkContainer = document.querySelector('#tierlist-available-perks');
  if (perkContainer) {
    perkContainer.removeEventListener("dragover", handlePerkListDragOver);
    perkContainer.removeEventListener("drop", handlePerkListDrop);
    perkContainer.removeEventListener("dragenter", handlePerkListDragEnter);
    perkContainer.removeEventListener("dragleave", handlePerkListDragLeave);
    
    perkContainer.addEventListener("dragover", handlePerkListDragOver);
    perkContainer.addEventListener("drop", handlePerkListDrop);
    perkContainer.addEventListener("dragenter", handlePerkListDragEnter);
    perkContainer.addEventListener("dragleave", handlePerkListDragLeave);
  }
}

// Drag and drop event handlers for perks
let draggedPerk = null;

function handlePerkDragStart(e) {
  console.log('🚀 Drag start on perk:', this.dataset.perkFile);
  draggedPerk = this;
  this.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", this.dataset.perkFile);
  // Store additional data for cross-browser compatibility
  e.dataTransfer.setData("application/json", JSON.stringify({
    perkFile: this.dataset.perkFile,
    characterFile: this.dataset.characterFile || null
  }));
  console.log('✅ Drag data set for:', this.dataset.perkFile);
}

function handlePerkDragEnd(e) {
  console.log('🏁 Drag end on perk:', this.dataset.perkFile);
  this.classList.remove("dragging");
  draggedPerk = null;
}

// Character drop zone handlers
function handleCharacterDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = "move";
  return false;
}

function handleCharacterDragEnter(e) {
  e.preventDefault();
  this.classList.add("drag-over");
  console.log('Drag enter on character:', this.dataset.characterFile);
}

function handleCharacterDragLeave(e) {
  // Only remove drag-over if we're actually leaving the element (not moving to a child)
  if (!this.contains(e.relatedTarget)) {
    this.classList.remove("drag-over");
    console.log('Drag leave from character:', this.dataset.characterFile);
  }
}

function handleCharacterDrop(e) {
  console.log('🎯 Drop event triggered on character:', this.dataset.characterFile);
  
  e.preventDefault();
  e.stopPropagation();
  
  this.classList.remove("drag-over");
  
  // Try multiple methods to get the dragged perk data
  let perkFile = null;
  let sourceCharacterFile = null;
  
  // Method 1: Use global draggedPerk variable
  if (draggedPerk) {
    console.log('✅ Using global draggedPerk:', draggedPerk.dataset.perkFile);
    perkFile = draggedPerk.dataset.perkFile;
    sourceCharacterFile = draggedPerk.dataset.characterFile;
  } else {
    console.log('⚠️ No global draggedPerk, trying dataTransfer...');
    
    // Method 2: Try dataTransfer
    try {
      perkFile = e.dataTransfer.getData("text/plain");
      console.log('📦 Got perk from dataTransfer:', perkFile);
      
      // Try to get JSON data
      const jsonData = e.dataTransfer.getData("application/json");
      if (jsonData) {
        const data = JSON.parse(jsonData);
        perkFile = data.perkFile;
        sourceCharacterFile = data.characterFile;
        console.log('📋 Got JSON data:', data);
      }
    } catch (err) {
      console.log('❌ DataTransfer failed:', err);
    }
  }
  
  if (perkFile) {
    const targetCharacterFile = this.dataset.characterFile;
    console.log('📋 Target:', targetCharacterFile, 'Source:', sourceCharacterFile, 'Perk:', perkFile);
    
    if (sourceCharacterFile && sourceCharacterFile !== targetCharacterFile) {
      // Moving perk between characters
      console.log('🔄 Moving perk between characters');
      movePerkBetweenCharacters(sourceCharacterFile, targetCharacterFile, perkFile);
    } else if (!sourceCharacterFile) {
      // Assigning perk from pool to character
      console.log('➕ Assigning perk to character');
      assignPerkToCharacter(targetCharacterFile, perkFile);
    }
  } else {
    console.log('❌ Could not determine perk file to drop');
  }
  
  return false;
}

// Assign a perk to a character
function assignPerkToCharacter(characterFile, perkFile) {
  let usedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
  
  // Check if character already has 4 perks
  const currentPerks = usedPerks[characterFile] || [];
  if (currentPerks.length >= 4) {
    alert("This character already has 4 perks!");
    return;
  }
  
  // Check if perk is already used by another character
  for (const [charFile, perksList] of Object.entries(usedPerks)) {
    if (perksList.includes(perkFile)) {
      if (perksLocked) {
        alert(`This perk is already used by another character!`);
        return;
      } else {
        // Remove from other character
        usedPerks[charFile] = perksList.filter(p => p !== perkFile);
        if (usedPerks[charFile].length === 0) {
          delete usedPerks[charFile];
        }
        break;
      }
    }
  }
  
  // Add perk to character
  if (!usedPerks[characterFile]) {
    usedPerks[characterFile] = [];
  }
  
  if (!usedPerks[characterFile].includes(perkFile)) {
    usedPerks[characterFile].push(perkFile);
    localStorage.setItem("dbd_used_perks", JSON.stringify(usedPerks));
    
    // Refresh displays - this will remove the perk from available list and show it on character
    populateTierlistCharacters();
    populateTierlistPerks();
    renderSavedProgress();
    if (typeof updateNavProgress === 'function') {
      updateNavProgress();
    }
  }
}

// Move a perk between characters
function movePerkBetweenCharacters(sourceCharacterFile, targetCharacterFile, perkFile) {
  let usedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
  
  // Check if target character already has 4 perks
  const targetPerks = usedPerks[targetCharacterFile] || [];
  if (targetPerks.length >= 4) {
    alert("Target character already has 4 perks!");
    return;
  }
  
  // Remove perk from source character
  if (usedPerks[sourceCharacterFile]) {
    usedPerks[sourceCharacterFile] = usedPerks[sourceCharacterFile].filter(p => p !== perkFile);
    
    if (usedPerks[sourceCharacterFile].length === 0) {
      delete usedPerks[sourceCharacterFile];
    }
  }
  
  // Add perk to target character
  if (!usedPerks[targetCharacterFile]) {
    usedPerks[targetCharacterFile] = [];
  }
  
  if (!usedPerks[targetCharacterFile].includes(perkFile)) {
    usedPerks[targetCharacterFile].push(perkFile);
  }
  
  localStorage.setItem("dbd_used_perks", JSON.stringify(usedPerks));
  
  // Refresh displays
  populateTierlistCharacters();
  populateTierlistPerks();
  renderSavedProgress();
  if (typeof updateNavProgress === 'function') {
    updateNavProgress();
  }
}

// Refresh tierlist when characters or completion status changes
function refreshTierlist() {
  if (currentView === "tierlist") {
    populateTierlistCharacters();
    populateTierlistPerks();
  }
}

// Initialize the tierlist toggle for showing/hiding used perks
function initializeTierlistToggle() {
  const toggleButton = document.getElementById("tierlist-show-used-toggle");
  if (toggleButton) {
    updateTierlistToggleButton();
    toggleButton.addEventListener("click", toggleTierlistShowUsedPerks);
  }
}

// Toggle show used perks mode for tierlist
function toggleTierlistShowUsedPerks() {
  // Cycle through: 0 = show all, 1 = hide used, 2 = hide completed
  showUsedPerksMode = (showUsedPerksMode + 1) % 3;
  localStorage.setItem("dbd_show_used_perks_mode", showUsedPerksMode.toString());
  
  updateTierlistToggleButton();
  populateTierlistPerks();
  
  // Also update the main toggle if it exists
  const mainToggleButton = document.getElementById("show-used-toggle");
  if (mainToggleButton && typeof toggleShowUsedPerks === 'function') {
    updateMainToggleButton(mainToggleButton);
  }
}

// Update the tierlist toggle button appearance and text
function updateTierlistToggleButton() {
  const toggleButton = document.getElementById("tierlist-show-used-toggle");
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
}

// Helper function to update main toggle button
function updateMainToggleButton(toggleButton) {
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

// Mini perk drag handlers (for dragging perks from characters)
function handleMiniPerkDragStart(e) {
  draggedPerk = this;
  this.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", this.dataset.perkFile);
  // Store additional data for cross-browser compatibility
  e.dataTransfer.setData("application/json", JSON.stringify({
    perkFile: this.dataset.perkFile,
    characterFile: this.dataset.characterFile
  }));
}

function handleMiniPerkDragEnd(e) {
  this.classList.remove("dragging");
  draggedPerk = null;
}

// Perk list drop zone handlers (for returning perks to the pool)
function handlePerkListDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = "move";
  return false;
}

function handlePerkListDragEnter(e) {
  this.classList.add("drag-over");
}

function handlePerkListDragLeave(e) {
  // Only remove drag-over if we're actually leaving the perk list
  if (!this.contains(e.relatedTarget)) {
    this.classList.remove("drag-over");
  }
}

function handlePerkListDrop(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  this.classList.remove("drag-over");
  
  if (draggedPerk) {
    const perkFile = draggedPerk.dataset.perkFile;
    const sourceCharacterFile = draggedPerk.dataset.characterFile;
    
    if (sourceCharacterFile) {
      // Remove perk from source character
      removePerkFromCharacter(sourceCharacterFile, perkFile);
    }
  }
  
  return false;
}

// Remove a perk from a character
function removePerkFromCharacter(characterFile, perkFile) {
  let usedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
  
  if (usedPerks[characterFile]) {
    usedPerks[characterFile] = usedPerks[characterFile].filter(p => p !== perkFile);
    
    // If no perks left for this character, remove the character entry
    if (usedPerks[characterFile].length === 0) {
      delete usedPerks[characterFile];
    }
    
    localStorage.setItem("dbd_used_perks", JSON.stringify(usedPerks));
    
    // Refresh displays
    populateTierlistCharacters();
    populateTierlistPerks();
    renderSavedProgress();
    if (typeof updateNavProgress === 'function') {
      updateNavProgress();
    }
  }
}
