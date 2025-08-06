// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

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
