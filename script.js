
// Global variable to track which character is currently selected

let selectedCharacter = null;

// Utility function to check if the character is a killer based on filename
function isKillerCharFile(charFile) {
  return charFile.startsWith("the-");
}

// URL based checker to find what side you doing
function getCurrentPageType() {
  return location.pathname.includes("killer") ? "killers" : "survivors";
}

// Updates the list of available perks based on which side
function updateAvailablePerks(type) {
  const perkContainer = document.getElementById("available-perks");
  if (!perkContainer) return;
  perkContainer.innerHTML = "";

  const path = type === "survivors" ? "survivors" : "killers";
  const perks = window.allPerks[path] || [];

  const usedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");

  perks.forEach(perk => {
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.display = "inline-block";
    wrapper.style.margin = "4px";

    const img = document.createElement("img");
    img.src = `assets/perks/${path}/${perk.file}`;
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
  const usedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
  const lockedChars = Object.keys(usedPerks);

  characters.forEach(character => {
    const card = document.createElement("div");
    card.classList.add("character-card");

    const img = document.createElement("img");
    img.src = `assets/characters/${character.type}/${character.file}.webp`;
    img.alt = character.name;

    if (lockedChars.includes(character.file)) {
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

      const perksForChar = usedPerks[character.file] || [];

      if (selectedCharacter && perksForChar.length > 0) {
        populatePerkSlots(perksForChar);
      } else {
        clearPerkSlots();
      }

      updateAvailablePerks(character.type);
      renderSavedProgress();
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

//Checks which perks are used
function isPerkUsed(perkFile) {
  let usedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
  return Object.values(usedPerks).some(perks => perks.includes(perkFile));
}

//Select perks
function selectPerk(perkFile) {
  if (!selectedCharacter) {
    alert("Pick a character.");
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
      });

      slot.appendChild(wrapper);
      break;
    }
  }
}

//Function to mark character that has been completed
function markCharacterCompleted() {
  if (!selectedCharacter) {
    alert("No character chosen.");
    return;
  }
  const selectedPerks = [];
  document.querySelectorAll(".perk-slot div img.perk-icon").forEach(img => {
    if (img && img.src) {
      const fileName = img.src.split("/").pop();
      selectedPerks.push(fileName);
    }
  });
  saveUsedPerks(selectedCharacter.file, selectedPerks);

  const titleEl = document.getElementById("selected-perks-title");
  if (titleEl) {
    titleEl.textContent = "Selected Perks";
  }

  alert("Progress saved!");
  renderSavedProgress();
  initCharacterList();
  clearPerkSlots();
  selectedCharacter = null;
}

//Resets the entire progress on the side you currently on
function resetPageProgress() {
  const page = getCurrentPageType(); // "killers" or "survivors"
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
    alert(`Progress ${page} is reset.`);
  } else {
    alert(`No progress for ${page} to reset.`);
  }
  selectedCharacter = null;
  const titleEl = document.getElementById("selected-perks-title");
  if (titleEl) titleEl.textContent = "Selected Perks";
  clearPerkSlots();
  initCharacterList();
  renderSavedProgress();
}

//Resets a picked character if accidently completed
function resetSelectedCharacter() {
  if (!selectedCharacter) {
    alert("No character chosen.");
    return;
  }
  if (!confirm(`Reset progress for ${selectedCharacter.name}?`)) return;

  let usedPerks = JSON.parse(localStorage.getItem("dbd_used_perks") || "{}");
  if (usedPerks[selectedCharacter.file]) {
    delete usedPerks[selectedCharacter.file];
    localStorage.setItem("dbd_used_perks", JSON.stringify(usedPerks));
    alert(`Progress ${selectedCharacter.name} is reset.`);
  } else {
    alert(`${selectedCharacter.name} has no saved progress.`);
  }

  clearPerkSlots();
  selectedCharacter = null;

  const titleEl = document.getElementById("selected-perks-title");
  if (titleEl) {
    titleEl.textContent = "Selected Perks";
  }

  initCharacterList();
  renderSavedProgress();
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

  const page = getCurrentPageType();
  if (page === "survivors") {
    renderCharacters(data.survivors, "survivor-list");
  } else {
    renderCharacters(data.killers, "killer-list");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  initCharacterList();
  renderSavedProgress();

  const controls = document.getElementById("controls");
  if (!controls) return;
  controls.innerHTML = "";

  const btnSave = document.createElement("button");
  btnSave.textContent = "Mark Character as Completed";
  btnSave.style.padding = "10px";
  btnSave.style.margin = "10px 5px 10px 0";
  btnSave.addEventListener("click", markCharacterCompleted);

  const btnResetPage = document.createElement("button");
  btnResetPage.textContent = "Reset Progress";
  btnResetPage.style.padding = "10px";
  btnResetPage.style.margin = "10px 5px 10px 0";
  btnResetPage.addEventListener("click", resetPageProgress);

  const btnResetSelected = document.createElement("button");
  btnResetSelected.textContent = "Reset Selected Character";
  btnResetSelected.style.padding = "10px";
  btnResetSelected.style.margin = "10px 0";
  btnResetSelected.addEventListener("click", resetSelectedCharacter);

  controls.appendChild(btnSave);
  controls.appendChild(btnResetPage);
  controls.appendChild(btnResetSelected);
});
