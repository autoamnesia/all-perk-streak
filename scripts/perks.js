// =============================================================================
// PERK MANAGEMENT FUNCTIONS
// =============================================================================

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
      // If showUsedPerks is false, hide used perks
      if (!showUsedPerks) {
        wrapper.style.display = "none";
        wrapper.appendChild(img);
        perkContainer.appendChild(wrapper);
        return;
      }

      img.style.opacity = "1";
      
      if (perksLocked) {
        img.style.pointerEvents = "auto"; // Allow right-click
        img.title = `${perk.name} - Used by ${usedByChar} (Right-click to remove)`;
      } else {
        img.style.pointerEvents = "auto";
        img.title = `${perk.name} - Used by ${usedByChar} (Click to reassign, Right-click to remove)`;
        img.onclick = () => selectPerk(perk.file);
      }

      // Right-click to remove perk from character
      img.addEventListener("contextmenu", (e) => {
        e.preventDefault(); // Prevent default context menu
        
        // Remove perk from the character
        let currentUsedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
        if (currentUsedPerks[usedByChar]) {
          currentUsedPerks[usedByChar] = currentUsedPerks[usedByChar].filter(p => p !== perk.file);
          
          // If no perks left for this character, remove the character entry
          if (currentUsedPerks[usedByChar].length === 0) {
            delete currentUsedPerks[usedByChar];
          }
          
          localStorage.setItem("dbd_used_perks", JSON.stringify(currentUsedPerks));
          
          // Refresh the display
          updateAvailablePerks(type);
          renderSavedProgress();
          
          // If this character is currently selected, update their perk slots
          if (selectedCharacter && selectedCharacter.file === usedByChar) {
            const updatedPerks = currentUsedPerks[usedByChar] || [];
            populatePerkSlots(updatedPerks);
          }
        }
      });

      const charType = isKillerCharFile(usedByChar) ? "killers" : "survivors";
      const charIcon = document.createElement("img");
      charIcon.src = `assets/characters/${charType}/${usedByChar}.webp`;
      charIcon.style.position = "absolute";
      charIcon.style.width = "24px";
      charIcon.style.height = "24px";
      charIcon.style.top = "0";
      charIcon.style.right = "0";
      charIcon.style.pointerEvents = "none"; // Don't block clicks
      charIcon.style.borderRadius = "50%";
      charIcon.style.border = "1px solid #fff";
      charIcon.style.zIndex = "5";
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

//Select perks
function selectPerk(perkFile) {
  if (!selectedCharacter) {
    return;
  }

  // Check if perk is used by another character
  const usedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
  let usedByChar = null;
  
  for (const [charFile, perksList] of Object.entries(usedPerks)) {
    if (perksList.includes(perkFile)) {
      usedByChar = charFile;
      break;
    }
  }

  // If perks are locked and perk is used by someone else, prevent selection
  if (perksLocked && usedByChar && usedByChar !== selectedCharacter.file) {
    alert("This perk is already used. Toggle the lock to reassign perks.");
    return;
  }

  const slots = document.querySelectorAll(".perk-slot");

  // Check if this perk is already in the current character's slots
  for (let slot of slots) {
    const imgWrapper = slot.querySelector("div");
    if (imgWrapper) {
      const img = imgWrapper.querySelector("img.perk-icon");
      if (img && img.src.endsWith(perkFile)) {
        slot.innerHTML = "";
        saveCurrentPerks();
        return;
      }
    }
  }

  // If perk is used by another character and unlocked, check for removal from completed
  if (!perksLocked && usedByChar && usedByChar !== selectedCharacter.file) {
    const completedChars = JSON.parse(localStorage.getItem("dbd_completed_chars") || "[]");
    const isUsedByCompletedChar = completedChars.includes(usedByChar);
    
    // If used by completed character and not allowed to remove, prevent selection
    if (isUsedByCompletedChar && !allowRemoveFromCompleted) {
      const characterName = characterData ? 
        (characterData.survivors.find(s => s.file === usedByChar) || 
         characterData.killers.find(k => k.file === usedByChar))?.name || usedByChar : 
        usedByChar;
      
      alert(`This perk is assigned to ${characterName} (completed). Enable "Allow Remove from Completed" to reassign it.`);
      return;
    }
    
    // Remove perk from previous character
    let currentUsedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
    if (currentUsedPerks[usedByChar]) {
      currentUsedPerks[usedByChar] = currentUsedPerks[usedByChar].filter(p => p !== perkFile);
      
      if (currentUsedPerks[usedByChar].length === 0) {
        delete currentUsedPerks[usedByChar];
      }
      
      localStorage.setItem("dbd_used_perks", JSON.stringify(currentUsedPerks));
    }
  }

  // Add perk to first available slot
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
        saveCurrentPerks();
      });

      slot.appendChild(wrapper);
      saveCurrentPerks();
      break;
    }
  }
}

// Add random unused perk to available slot
function addRandomPerk() {
  if (!selectedCharacter) {
    return;
  }

  // Check if there are any empty slots
  const slots = document.querySelectorAll(".perk-slot");
  let hasEmptySlot = false;
  for (let slot of slots) {
    if (slot.children.length === 0) {
      hasEmptySlot = true;
      break;
    }
  }
  
  if (!hasEmptySlot) {
    return; // All slots are full
  }

  // Get all available perks for this character type
  const allPerks = window.allPerks[selectedCharacter.type] || [];
  const usedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
  
  // Filter out perks that are already used by any character
  const unusedPerks = allPerks.filter(perk => {
    return !Object.values(usedPerks).some(perksList => perksList.includes(perk.file));
  });
  
  if (unusedPerks.length === 0) {
    return; // No unused perks available
  }
  
  // Select a random unused perk
  const randomPerk = unusedPerks[Math.floor(Math.random() * unusedPerks.length)];
  
  // Add the random perk to the first available slot
  selectPerk(randomPerk.file);
}
