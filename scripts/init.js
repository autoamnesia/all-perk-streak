// =============================================================================
// APPLICATION INITIALIZATION AND EVENT HANDLING
// =============================================================================

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
  
  // Update streamer overlay now that character data is loaded
  if (typeof updateStreamerOverlay === 'function') {
    updateStreamerOverlay();
  }
}

// Main initialization function for character/perk pages
async function initializePage() {
  // Prevent right-click context menu globally
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  // Wait for character data to load first
  await initCharacterList();
  renderSavedProgress();

  const controls = document.getElementById("controls");
  if (!controls) return;
  controls.innerHTML = "";

  // Create settings toggle button
  const settingsToggle = document.createElement("button");
  settingsToggle.className = "settings-toggle";
  settingsToggle.innerHTML = "⚙️ Settings";
  settingsToggle.title = "Click to show/hide settings";
  
  // Create collapsible content container
  const controlsContent = document.createElement("div");
  controlsContent.className = "controls-content";

  // Create organized control sections
  const toggleSection = document.createElement("div");
  toggleSection.className = "controls-row";
  const toggleLabel = document.createElement("span");
  toggleLabel.className = "controls-label";
  toggleLabel.textContent = "Settings:";
  toggleSection.appendChild(toggleLabel);

  const actionSection = document.createElement("div");
  actionSection.className = "controls-row";
  const actionLabel = document.createElement("span");
  actionLabel.className = "controls-label";
  actionLabel.textContent = "Actions:";
  actionSection.appendChild(actionLabel);

  const dataSection = document.createElement("div");
  dataSection.className = "controls-row";
  const dataLabel = document.createElement("span");
  dataLabel.className = "controls-label";
  dataLabel.textContent = "Data:";
  dataSection.appendChild(dataLabel);

  // Add toggle functionality
  let isExpanded = JSON.parse(localStorage.getItem("dbd_settings_expanded") || "false");
  
  // Set initial state
  if (isExpanded) {
    controlsContent.classList.add("expanded");
    settingsToggle.classList.add("expanded");
    settingsToggle.innerHTML = "⚙️ Hide Settings";
  }
  
  settingsToggle.addEventListener("click", () => {
    isExpanded = !isExpanded;
    localStorage.setItem("dbd_settings_expanded", JSON.stringify(isExpanded));
    
    if (isExpanded) {
      controlsContent.classList.add("expanded");
      settingsToggle.classList.add("expanded");
      settingsToggle.innerHTML = "⚙️ Hide Settings";
    } else {
      controlsContent.classList.remove("expanded");
      settingsToggle.classList.remove("expanded");
      settingsToggle.innerHTML = "⚙️ Settings";
    }
  });

  // Add perk lock toggle button
  const btnPerkLock = document.createElement("button");
  btnPerkLock.id = "perk-lock-toggle";
  btnPerkLock.className = perksLocked ? "control-button danger" : "control-button success";
  btnPerkLock.textContent = perksLocked ? "🔒 Unlock Perks" : "🔓 Lock Perks";
  btnPerkLock.title = perksLocked ? 
    "Click to unlock perks (allows reassigning used perks)" : 
    "Click to lock perks (prevents reassigning used perks)";
  btnPerkLock.addEventListener("click", togglePerkLock);

  // Add allow remove from completed toggle button
  const btnAllowRemoveCompleted = document.createElement("button");
  btnAllowRemoveCompleted.id = "allow-remove-completed-toggle";
  btnAllowRemoveCompleted.className = allowRemoveFromCompleted ? "control-button toggle-active" : "control-button success";
  btnAllowRemoveCompleted.textContent = allowRemoveFromCompleted ? "🔓 Allow Remove from Completed" : "🔒 Protect Completed";
  btnAllowRemoveCompleted.title = allowRemoveFromCompleted ? 
    "Click to protect perks assigned to completed characters" : 
    "Click to allow removing perks from completed characters";
  btnAllowRemoveCompleted.addEventListener("click", toggleAllowRemoveFromCompleted);

  // Add colorful perks toggle button
  const btnColorfulPerks = document.createElement("button");
  btnColorfulPerks.id = "colorful-perks-toggle";
  btnColorfulPerks.className = colorfulPerks ? "control-button toggle-active" : "control-button success";
  btnColorfulPerks.textContent = colorfulPerks ? "🎨 Colorful Perks" : "🖤 Simple Perks";
  btnColorfulPerks.title = colorfulPerks ? 
    "Click to disable colorful perk backgrounds" : 
    "Click to enable colorful perk backgrounds";
  btnColorfulPerks.addEventListener("click", function() {
    console.log("Colorful perks button clicked!");
    console.log("Current colorfulPerks state:", colorfulPerks);
    
    // Toggle the state
    colorfulPerks = !colorfulPerks;
    localStorage.setItem("dbd_colorful_perks", JSON.stringify(colorfulPerks));
    
    console.log("New colorfulPerks state:", colorfulPerks);
    
    // Update button appearance and text
    btnColorfulPerks.textContent = colorfulPerks ? "🎨 Colorful Perks" : "🖤 Simple Perks";
    btnColorfulPerks.className = colorfulPerks ? "control-button toggle-active" : "control-button success";
    btnColorfulPerks.title = colorfulPerks ? 
      "Click to disable colorful perk backgrounds" : 
      "Click to enable colorful perk backgrounds";
    
    console.log("Button updated, adding/removing CSS class...");
    
    // Update CSS class on body to trigger style changes
    if (colorfulPerks) {
      document.body.classList.add('colorful-perks');
      console.log("Added colorful-perks class to body");
    } else {
      document.body.classList.remove('colorful-perks');
      console.log("Removed colorful-perks class from body");
    }
    
    console.log("Body classes:", document.body.className);
    
    // Refresh available perks to update appearance
    if (selectedCharacter) {
      updateAvailablePerks(selectedCharacter.type);
      console.log("Updated perks for selected character");
    } else {
      updateAvailablePerks(getCurrentPageType());
      console.log("Updated perks for current page type");
    }
    
    // Also refresh tierlist if in tierlist view
    if (typeof refreshTierlist === 'function') {
      refreshTierlist();
      console.log("Refreshed tierlist");
    }
  });

  // Add view toggle button
  const btnViewToggle = document.createElement("button");
  btnViewToggle.id = "view-toggle-btn";
  btnViewToggle.className = "control-button primary";
  btnViewToggle.textContent = "📋 Switch to Tierlist View";
  btnViewToggle.title = "Switch to tierlist view for drag-and-drop perk assignment";
  // Event listener will be added by tierlist.js after all controls are created

  const btnResetPage = document.createElement("button");
  btnResetPage.className = "control-button danger";
  btnResetPage.textContent = "Reset Streak Progress";
  btnResetPage.addEventListener("click", resetPageProgress);

  const btnResetPerks = document.createElement("button");
  btnResetPerks.className = "control-button danger";
  btnResetPerks.textContent = "Reset Perks";
  btnResetPerks.addEventListener("click", resetAllPerks);

  const btnResetAll = document.createElement("button");
  btnResetAll.className = "control-button danger";
  btnResetAll.textContent = "Reset All";
  btnResetAll.addEventListener("click", resetAll);

  const btnDownload = document.createElement("button");
  btnDownload.className = "control-button success";
  btnDownload.textContent = "📥 Download Progress";
  btnDownload.addEventListener("click", downloadProgress);

  const btnUpload = document.createElement("button");
  btnUpload.className = "control-button primary";
  btnUpload.textContent = "📤 Upload Progress";
  btnUpload.addEventListener("click", uploadProgress);

  // Add buttons to appropriate sections
  toggleSection.appendChild(btnPerkLock);
  toggleSection.appendChild(btnAllowRemoveCompleted);
  toggleSection.appendChild(btnColorfulPerks);
  
  actionSection.appendChild(btnViewToggle);
  actionSection.appendChild(btnResetPage);
  actionSection.appendChild(btnResetPerks);
  actionSection.appendChild(btnResetAll);
  
  dataSection.appendChild(btnDownload);
  dataSection.appendChild(btnUpload);
  
  // Add reset always reassign button if it's currently enabled
  if (alwaysReassignFromCompleted) {
    const btnResetAlways = document.createElement("button");
    btnResetAlways.className = "control-button toggle-active";
    btnResetAlways.textContent = "Reset Auto-Reassign";
    btnResetAlways.title = "Reset the 'always reassign from completed characters' setting";
    btnResetAlways.addEventListener("click", () => {
      alwaysReassignFromCompleted = false;
      localStorage.setItem("dbd_always_reassign_completed", JSON.stringify(false));
      alert("Auto-reassign setting reset. You'll be asked for confirmation again.");
      location.reload();
    });
    toggleSection.appendChild(btnResetAlways);
  }
  
  // Add all sections to collapsible content
  controlsContent.appendChild(toggleSection);
  controlsContent.appendChild(actionSection);
  controlsContent.appendChild(dataSection);
  
  // Add toggle button and content to controls
  controls.appendChild(settingsToggle);
  controls.appendChild(controlsContent);

  // Initialize character control buttons
  initializeCharacterControls();

  // Initialize colorful perks state
  if (colorfulPerks) {
    document.body.classList.add('colorful-perks');
  }

// Function to initialize character control buttons
function initializeCharacterControls() {
  const showCompletedToggle = document.getElementById("show-completed-toggle");
  const randomCharBtn = document.getElementById("random-char-btn");
  
  if (showCompletedToggle) {
    showCompletedToggle.addEventListener("click", () => {
      showCompleted = !showCompleted;
      localStorage.setItem("dbd_show_completed", JSON.stringify(showCompleted));
      
      // Update button appearance
      showCompletedToggle.textContent = showCompleted ? "🏆 Hide Completed" : "🏆 Show Completed";
      
      // Re-render character list
      initCharacterList();
    });
    
    // Set initial state
    showCompletedToggle.textContent = showCompleted ? "🏆 Hide Completed" : "🏆 Show Completed";
  }
  
  if (randomCharBtn) {
    randomCharBtn.addEventListener("click", selectRandomCharacter);
  }
}

  // Initialize tierlist functionality after all controls are created
  setTimeout(() => {
    if (typeof initTierlist === 'function') {
      initTierlist();
    }
  }, 0);

  // Add event listener for random perk button
  const randomPerkBtn = document.getElementById("random-perk-btn");
  if (randomPerkBtn) {
    randomPerkBtn.addEventListener("click", addRandomPerk);
  }

  const searchInput = document.getElementById("perk-search");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      if (selectedCharacter) {
        updateAvailablePerks(selectedCharacter.type);
      } else {
        updateAvailablePerks(getCurrentPageType());
      }
    });

    // Add toggle button next to search input
    const searchContainer = searchInput.parentElement;
    if (searchContainer) {
      const toggleButton = document.createElement("button");
      toggleButton.id = "show-used-toggle";
      
      // Set initial button state based on mode
      switch (showUsedPerksMode) {
        case 0: // Show all
          toggleButton.textContent = "👁️ Show All";
          toggleButton.style.backgroundColor = "#4CAF50";
          toggleButton.title = "Showing all perks. Click to hide used perks.";
          break;
        case 1: // Hide used
          toggleButton.textContent = "Hide Used";
          toggleButton.style.backgroundColor = "#666";
          toggleButton.title = "Hiding used perks. Click to hide only completed perks.";
          break;
        case 2: // Hide completed
          toggleButton.textContent = "🏆 Hide Completed";
          toggleButton.style.backgroundColor = "#FF9800";
          toggleButton.title = "Hiding perks used by completed characters. Click to show all perks.";
          break;
      }
      
      toggleButton.style.padding = "8px 12px";
      toggleButton.style.marginLeft = "10px";
      toggleButton.style.color = "white";
      toggleButton.style.border = "none";
      toggleButton.style.borderRadius = "4px";
      toggleButton.style.cursor = "pointer";
      toggleButton.style.fontSize = "14px";
      toggleButton.addEventListener("click", toggleShowUsedPerks);
      
      searchContainer.appendChild(toggleButton);
    }
  }
}

// Initialize the appropriate page based on the current page
window.addEventListener("DOMContentLoaded", async () => {
  // Check if this is the home page or a character page
  if (document.getElementById("controls")) {
    // This is a character/perk page
    initializePage();
  } else {
    // This is the home page
    updateCompletionCounters();
    
    // Load character data for overlay on home page too
    if (!characterData) {
      try {
        const res = await fetch("characters.json");
        const data = await res.json();
        characterData = data;
        window.allPerks = data.perks;
      } catch (error) {
        console.error('Failed to load character data on home page:', error);
      }
    }
  }
  
  // Initialize overlay system if available (give time for data to load)
  if (typeof updateStreamerOverlay === 'function') {
    setTimeout(updateStreamerOverlay, 500);
  }
  
  // Initialize colorful perks state on all pages
  if (colorfulPerks) {
    document.body.classList.add('colorful-perks');
  }
  
  // Add version display to all pages
  addVersionDisplay();
  
  // Add credits display to all pages
  // addCreditsDisplay(); // Removed - credits now in bottom left corner of HTML
});

// Add version display in bottom right corner
function addVersionDisplay() {
  const versionDiv = document.createElement("div");
  versionDiv.textContent = `v${APP_VERSION}`;
  versionDiv.style.position = "fixed";
  versionDiv.style.bottom = "10px";
  versionDiv.style.right = "10px";
  versionDiv.style.fontSize = "10px";
  versionDiv.style.color = "#666";
  versionDiv.style.fontFamily = "Arial, sans-serif";
  versionDiv.style.zIndex = "1000";
  versionDiv.style.pointerEvents = "none";
  versionDiv.style.userSelect = "none";
  
  document.body.appendChild(versionDiv);
}

// Credits display function removed - credits now in HTML footer
