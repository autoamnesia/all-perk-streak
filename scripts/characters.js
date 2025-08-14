// =============================================================================
// CHARACTER RENDERING AND MANAGEMENT
// =============================================================================

// Selects a random character from available characters
function selectRandomCharacter() {
  const currentPageType = getCurrentPageType();
  let characters;
  
  if (currentPageType === "killers") {
    characters = characterData?.killers || [];
  } else if (currentPageType === "survivors") {
    characters = characterData?.survivors || [];
  } else {
    return;
  }
  
  if (characters.length === 0) {
    alert("Character data not loaded yet. Please wait and try again.");
    return;
  }
  
  // Get completed characters
  const completedChars = JSON.parse(localStorage.getItem("dbd_completed_chars") || "[]");
  
  // Filter out completed characters (only select from non-completed ones)
  const availableCharacters = characters.filter(character => !completedChars.includes(character.file));
  
  if (availableCharacters.length === 0) {
    alert("No non-completed characters available to select!");
    return;
  }
  
  // Select a random character from non-completed ones
  const randomIndex = Math.floor(Math.random() * availableCharacters.length);
  const randomCharacter = availableCharacters[randomIndex];
  
  // Use the existing character selection logic
  selectedCharacter = randomCharacter;
  
  // Update all character borders properly
  updateCharacterBorders();

  // Update title
  const titleEl = document.getElementById("selected-perks-title");
  if (titleEl) {
    titleEl.textContent = `Selected Perks For ${randomCharacter.name}`;
  }

  // Get fresh perks data from localStorage
  const currentUsedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
  const perksForChar = currentUsedPerks[randomCharacter.file] || [];

  if (perksForChar.length > 0) {
    populatePerkSlots(perksForChar);
  } else {
    clearPerkSlots();
  }

  updateAvailablePerks(randomCharacter.type);
  
  // Refresh character list to update visual states
  setTimeout(() => {
    if (typeof initCharacterList === 'function') {
      initCharacterList();
    }
  }, 100);
}

// Renders characters
function renderCharacters(characters, containerId) {
  // For the new layout, always use "killer-list" or "survivor-list"
  const actualContainerId = containerId.includes("killer") ? "killer-list" : 
                           containerId.includes("survivor") ? "survivor-list" : containerId;
  
  const container = document.getElementById(actualContainerId);
  if (!container) return;

  container.innerHTML = "";
  const completedChars = JSON.parse(localStorage.getItem("dbd_completed_chars") || "[]");

  // Filter characters based on showCompleted toggle
  // When showCompleted is true: show all characters  
  // When showCompleted is false: show only non-completed characters
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
      img.dataset.locked = "true";
    } else {
      img.dataset.locked = "";
    }

    // Add selected class if this is the selected character
    if (selectedCharacter && selectedCharacter.file === character.file) {
      img.classList.add("selected");
    }

    const name = document.createElement("div");
    name.className = "character-name";
    name.textContent = character.name;

    img.addEventListener("click", () => {
      // Remove selected class from all character images
      document.querySelectorAll(".character-card img").forEach(img => {
        img.classList.remove("selected");
      });
      
      // Add selected class to clicked image
      img.classList.add("selected");
      
      selectedCharacter = character;
      
      // Update character borders to show selection
      updateCharacterBorders();
      
      // Update title
      const titleEl = document.getElementById("selected-perks-title");
      if (titleEl) {
        titleEl.textContent = `${character.name}`;
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

        // Always update available perks to refresh green dot indicators
        if (typeof selectedCharacter !== 'undefined' && selectedCharacter && selectedCharacter.type) {
          updateAvailablePerks(selectedCharacter.type);
        } else if (typeof getCurrentPageType === 'function') {
          updateAvailablePerks(getCurrentPageType());
        }

        // Update progress displays immediately
        if (typeof renderSavedProgress === 'function') {
          renderSavedProgress();
        }
        if (typeof updateNavProgress === 'function') {
          updateNavProgress();
        }

        // If hide completed is active, refresh character list to show character again
        if (!showCompleted) {
          setTimeout(() => {
            if (typeof initCharacterList === 'function') {
              initCharacterList();
            }
          }, 100);
        }
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
      
      // Update progress displays
      if (typeof updateNavProgress === 'function') {
        updateNavProgress();
      }
      
      // If hide completed is active, refresh character list to hide/show characters immediately
      if (!showCompleted) {
        setTimeout(() => {
          if (typeof initCharacterList === 'function') {
            initCharacterList();
          }
        }, 100);
      }
      
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

  // Update character borders after rendering to apply initial styles
  updateCharacterBorders();
}

//Updates character borders to reflect completion status in real-time
function updateCharacterBorders() {
  const usedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
  const completedChars = JSON.parse(localStorage.getItem("dbd_completed_chars") || "[]");
  
  document.querySelectorAll(".character-grid img").forEach(img => {
    const characterFile = img.src.split("/").pop().replace(".webp", "");
    const isCompleted = completedChars.includes(characterFile);
    const isSelected = selectedCharacter && selectedCharacter.file === characterFile;
    
    // Reset all classes
    img.classList.remove("completed", "selected");
    
    // Add appropriate classes
    if (isCompleted) {
      img.classList.add("completed");
      img.dataset.locked = "true";
    } else {
      img.dataset.locked = "";
    }
    
    if (isSelected) {
      img.classList.add("selected");
    }
    
    // Clear any inline styles that might interfere
    img.style.border = "";
    img.style.boxShadow = "";
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
