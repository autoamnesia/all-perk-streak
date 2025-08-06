// =============================================================================
// PROGRESS DISPLAY AND RENDERING
// =============================================================================

// Update completion counters on home page
async function updateCompletionCounters() {
  try {
    const res = await fetch("characters.json");
    const data = await res.json();
    
    console.log("Characters data structure:", data); // Debug
    
    const completedChars = JSON.parse(localStorage.getItem("dbd_completed_chars") || "[]");
    
    console.log("Completed characters:", completedChars); // Debug
    
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
    
    // Get totals
    const totalKillers = data.killers ? data.killers.length : 0;
    const totalSurvivors = data.survivors ? data.survivors.length : 0;
    
    // Ensure completed counts don't exceed totals
    completedKillers = Math.min(completedKillers, totalKillers);
    completedSurvivors = Math.min(completedSurvivors, totalSurvivors);
    
    console.log(`Counts - Killers: ${completedKillers}/${totalKillers}, Survivors: ${completedSurvivors}/${totalSurvivors}`); // Debug
    
    // Update the counters and progress bars
    const killersCounter = document.getElementById("killers-counter");
    const survivorsCounter = document.getElementById("survivors-counter");
    const killersProgress = document.getElementById("killers-progress");
    const survivorsProgress = document.getElementById("survivors-progress");
    
    if (killersCounter && killersProgress) {
      killersCounter.textContent = `${completedKillers}/${totalKillers}`;
      const killersPercentage = totalKillers > 0 ? (completedKillers / totalKillers) * 100 : 0;
      killersProgress.style.width = `${killersPercentage}%`;
    }
    if (survivorsCounter && survivorsProgress) {
      survivorsCounter.textContent = `${completedSurvivors}/${totalSurvivors}`;
      const survivorsPercentage = totalSurvivors > 0 ? (completedSurvivors / totalSurvivors) * 100 : 0;
      survivorsProgress.style.width = `${survivorsPercentage}%`;
    }
  } catch (error) {
    console.error("Error updating completion counters:", error);
  }
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

// Update completion counters (specific to home page)
async function updateCompletionCounters() {
  try {
    const res = await fetch("characters.json");
    const data = await res.json();
    
    console.log("Characters data structure:", data); // Debug
    
    const completedChars = JSON.parse(localStorage.getItem("dbd_completed_chars") || "[]");
    
    console.log("Completed characters:", completedChars); // Debug
    
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
    
    // Get totals
    const totalKillers = data.killers ? data.killers.length : 0;
    const totalSurvivors = data.survivors ? data.survivors.length : 0;
    
    // Ensure completed counts don't exceed totals
    completedKillers = Math.min(completedKillers, totalKillers);
    completedSurvivors = Math.min(completedSurvivors, totalSurvivors);
    
    console.log(`Counts - Killers: ${completedKillers}/${totalKillers}, Survivors: ${completedSurvivors}/${totalSurvivors}`); // Debug
    
    // Update the counters and progress bars
    const killersCounter = document.getElementById("killers-counter");
    const survivorsCounter = document.getElementById("survivors-counter");
    const killersProgress = document.getElementById("killers-progress");
    const survivorsProgress = document.getElementById("survivors-progress");
    
    if (killersCounter && killersProgress) {
      killersCounter.textContent = `${completedKillers}/${totalKillers}`;
      const killersPercentage = totalKillers > 0 ? (completedKillers / totalKillers) * 100 : 0;
      killersProgress.style.width = `${killersPercentage}%`;
    }
    if (survivorsCounter && survivorsProgress) {
      survivorsCounter.textContent = `${completedSurvivors}/${totalSurvivors}`;
      const survivorsPercentage = totalSurvivors > 0 ? (completedSurvivors / totalSurvivors) * 100 : 0;
      survivorsProgress.style.width = `${survivorsPercentage}%`;
    }
  } catch (error) {
    console.error("Error updating completion counters:", error);
  }
}
