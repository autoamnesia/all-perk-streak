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
}

// Main initialization function for character/perk pages
function initializePage() {
  // Prevent right-click context menu globally
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  initCharacterList();
  renderSavedProgress();

  const controls = document.getElementById("controls");
  if (!controls) return;
  controls.innerHTML = "";

  // Add perk lock toggle button
  const btnPerkLock = document.createElement("button");
  btnPerkLock.id = "perk-lock-toggle";
  btnPerkLock.textContent = perksLocked ? "🔒 Unlock Perks" : "🔓 Lock Perks";
  btnPerkLock.style.padding = "10px";
  btnPerkLock.style.margin = "10px 5px 10px 0";
  btnPerkLock.style.backgroundColor = perksLocked ? "#f44336" : "#4CAF50";
  btnPerkLock.style.color = "white";
  btnPerkLock.style.border = "none";
  btnPerkLock.style.borderRadius = "4px";
  btnPerkLock.style.cursor = "pointer";
  btnPerkLock.title = perksLocked ? 
    "Click to unlock perks (allows reassigning used perks)" : 
    "Click to lock perks (prevents reassigning used perks)";
  btnPerkLock.addEventListener("click", togglePerkLock);

  // Add allow remove from completed toggle button
  const btnAllowRemoveCompleted = document.createElement("button");
  btnAllowRemoveCompleted.id = "allow-remove-completed-toggle";
  btnAllowRemoveCompleted.textContent = allowRemoveFromCompleted ? "🔓 Allow Remove from Completed" : "🔒 Protect Completed";
  btnAllowRemoveCompleted.style.padding = "10px";
  btnAllowRemoveCompleted.style.margin = "10px 5px 10px 0";
  btnAllowRemoveCompleted.style.backgroundColor = allowRemoveFromCompleted ? "#FF9800" : "#4CAF50";
  btnAllowRemoveCompleted.style.color = "white";
  btnAllowRemoveCompleted.style.border = "none";
  btnAllowRemoveCompleted.style.borderRadius = "4px";
  btnAllowRemoveCompleted.style.cursor = "pointer";
  btnAllowRemoveCompleted.title = allowRemoveFromCompleted ? 
    "Click to protect perks assigned to completed characters" : 
    "Click to allow removing perks from completed characters";
  btnAllowRemoveCompleted.addEventListener("click", toggleAllowRemoveFromCompleted);

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

  const btnResetAll = document.createElement("button");
  btnResetAll.textContent = "Reset All";
  btnResetAll.style.padding = "10px";
  btnResetAll.style.margin = "10px 5px 10px 0";
  btnResetAll.addEventListener("click", resetAll);

  const btnDownload = document.createElement("button");
  btnDownload.textContent = "Download Progress";
  btnDownload.style.padding = "10px";
  btnDownload.style.margin = "10px 5px 10px 0";
  btnDownload.style.backgroundColor = "#4CAF50";
  btnDownload.style.color = "white";
  btnDownload.style.border = "none";
  btnDownload.style.borderRadius = "4px";
  btnDownload.addEventListener("click", downloadProgress);

  const btnUpload = document.createElement("button");
  btnUpload.textContent = "Upload Progress";
  btnUpload.style.padding = "10px";
  btnUpload.style.margin = "10px 5px 10px 0";
  btnUpload.style.backgroundColor = "#2196F3";
  btnUpload.style.color = "white";
  btnUpload.style.border = "none";
  btnUpload.style.borderRadius = "4px";
  btnUpload.addEventListener("click", uploadProgress);

  // Add all buttons to controls
  controls.appendChild(btnPerkLock);
  controls.appendChild(btnAllowRemoveCompleted);
  
  // Add reset always reassign button if it's currently enabled
  if (alwaysReassignFromCompleted) {
    const btnResetAlways = document.createElement("button");
    btnResetAlways.textContent = "Reset Auto-Reassign";
    btnResetAlways.style.padding = "10px";
    btnResetAlways.style.margin = "10px 5px 10px 0";
    btnResetAlways.style.backgroundColor = "#FF9800";
    btnResetAlways.style.color = "white";
    btnResetAlways.style.border = "none";
    btnResetAlways.style.borderRadius = "4px";
    btnResetAlways.style.cursor = "pointer";
    btnResetAlways.title = "Reset the 'always reassign from completed characters' setting";
    btnResetAlways.addEventListener("click", () => {
      alwaysReassignFromCompleted = false;
      localStorage.setItem("dbd_always_reassign_completed", JSON.stringify(false));
      alert("Auto-reassign setting reset. You'll be asked for confirmation again.");
      location.reload();
    });
    controls.appendChild(btnResetAlways);
  }
  
  controls.appendChild(btnResetPage);
  controls.appendChild(btnResetPerks);
  controls.appendChild(btnResetAll);
  controls.appendChild(btnDownload);
  controls.appendChild(btnUpload);

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
      toggleButton.textContent = showUsedPerks ? "👁️ Hide Used" : "👁️ Show Used";
      toggleButton.style.padding = "8px 12px";
      toggleButton.style.marginLeft = "10px";
      toggleButton.style.backgroundColor = showUsedPerks ? "#2196F3" : "#666";
      toggleButton.style.color = "white";
      toggleButton.style.border = "none";
      toggleButton.style.borderRadius = "4px";
      toggleButton.style.cursor = "pointer";
      toggleButton.style.fontSize = "14px";
      toggleButton.title = showUsedPerks ? 
        "Click to hide used perks" : 
        "Click to show used perks";
      toggleButton.addEventListener("click", toggleShowUsedPerks);
      
      searchContainer.appendChild(toggleButton);
    }
  }
}

// Initialize the appropriate page based on the current page
window.addEventListener("DOMContentLoaded", () => {
  // Check if this is the home page or a character page
  if (document.getElementById("controls")) {
    // This is a character/perk page
    initializePage();
  } else {
    // This is the home page
    updateCompletionCounters();
  }
  
  // Add version display to all pages
  addVersionDisplay();
  
  // Add credits display to all pages
  addCreditsDisplay();
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

// Add credits display in top left corner
function addCreditsDisplay() {
  const creditsDiv = document.createElement("div");
  creditsDiv.innerHTML = `
    🛠️ Tool made by 
    <a href="https://github.com/Pokejongen" target="_blank" style="color: #4CAF50; text-decoration: none;">T5K</a> 
    and 
    <a href="https://github.com/autoamnesia" target="_blank" style="color: #4CAF50; text-decoration: none;">autoamnesia</a>
  `;
  creditsDiv.style.position = "fixed";
  creditsDiv.style.top = "10px";
  creditsDiv.style.left = "10px";
  creditsDiv.style.fontSize = "10px";
  creditsDiv.style.color = "#666";
  creditsDiv.style.fontFamily = "Arial, sans-serif";
  creditsDiv.style.zIndex = "1000";
  creditsDiv.style.pointerEvents = "auto";
  creditsDiv.style.userSelect = "none";
  creditsDiv.style.lineHeight = "1.2";
  
  // Style the links on hover
  const links = creditsDiv.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('mouseenter', () => {
      link.style.textDecoration = 'underline';
    });
    link.addEventListener('mouseleave', () => {
      link.style.textDecoration = 'none';
    });
  });
  
  document.body.appendChild(creditsDiv);
}
