// =============================================================================
// GLOBAL STATE MANAGEMENT
// =============================================================================

// Application version
const APP_VERSION = "2.4";

// Global variable to track which character is currently selected
let selectedCharacter = null;

// Store character data globally for type checking
let characterData = null;

// Global variable to track if perks are locked
let perksLocked = JSON.parse(localStorage.getItem("dbd_perks_locked") || "true");

// Global variable to track if user wants to always reassign from completed characters
let alwaysReassignFromCompleted = JSON.parse(localStorage.getItem("dbd_always_reassign_completed") || "false");

// Global variable to track show used perks mode (0 = show all, 1 = hide used, 2 = hide completed)
let showUsedPerksMode = parseInt(localStorage.getItem("dbd_show_used_perks_mode") || "0");

// Backward compatibility: convert old boolean showUsedPerks to new mode system
if (localStorage.getItem("dbd_show_used_perks") !== null && localStorage.getItem("dbd_show_used_perks_mode") === null) {
  const oldShowUsedPerks = JSON.parse(localStorage.getItem("dbd_show_used_perks"));
  showUsedPerksMode = oldShowUsedPerks ? 0 : 1; // 0 = show all, 1 = hide used
  localStorage.setItem("dbd_show_used_perks_mode", showUsedPerksMode.toString());
  localStorage.removeItem("dbd_show_used_perks"); // Remove old setting
}

// Global variable to track if perks can be removed from completed characters
let allowRemoveFromCompleted = JSON.parse(localStorage.getItem("dbd_allow_remove_completed") || "false");

// Global variable to track if completed characters are shown
let showCompleted = JSON.parse(localStorage.getItem("dbd_show_completed") || "true");
