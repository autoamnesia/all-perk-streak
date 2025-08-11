// =============================================================================
// CHARACTER RENDERING AND MANAGEMENT
// =============================================================================

// Renders characters
function renderCharacters(characters, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";
  const completedChars = JSON.parse(localStorage.getItem("dbd_completed_chars") || "[]");

  // Filter characters based on showCompleted toggle
  const charactersToShow = showCompleted ? 
    characters : 
    characters.filter(character => !completedChars.includes(character.file));

  charactersToShow.forEach(character => {
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
      selectedCharacter = character;
      
      // Update all character borders properly
      updateCharacterBorders();

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

        if (perksForChar.length > 0) {
          populatePerkSlots(perksForChar);
        } else {
          clearPerkSlots();
        }

        updateAvailablePerks(character.type);
        renderSavedProgress();
      }
      
      updateCharacterBorders();
      
      // Update streamer overlay when completion status changes
      if (typeof updateStreamerOverlay === 'function') {
        updateStreamerOverlay();
      }
      
      // Refresh tierlist if in tierlist view
      if (typeof refreshTierlist === 'function') {
        refreshTierlist();
      }
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

          if (perksForChar.length > 0) {
            populatePerkSlots(perksForChar);
          } else {
            clearPerkSlots();
          }

          updateAvailablePerks(character.type);
          renderSavedProgress();
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
  
  // Update streamer overlay when character is completed
  if (typeof updateStreamerOverlay === 'function') {
    updateStreamerOverlay();
  }
}
