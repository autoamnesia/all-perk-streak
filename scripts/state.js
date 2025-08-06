// =============================================================================
// GLOBAL STATE MANAGEMENT
// =============================================================================

// Application version
const APP_VERSION = "2.0";

// Global variable to track which character is currently selected
let selectedCharacter = null;

// Store character data globally for type checking
let characterData = null;

// Global variable to track if perks are locked
let perksLocked = JSON.parse(localStorage.getItem("dbd_perks_locked") || "true");

// Global variable to track if user wants to always reassign from completed characters
let alwaysReassignFromCompleted = JSON.parse(localStorage.getItem("dbd_always_reassign_completed") || "false");

// Global variable to track if used perks are shown
let showUsedPerks = JSON.parse(localStorage.getItem("dbd_show_used_perks") || "true");

// Global variable to track if perks can be removed from completed characters
let allowRemoveFromCompleted = JSON.parse(localStorage.getItem("dbd_allow_remove_completed") || "false");
