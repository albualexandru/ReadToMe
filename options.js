const DEFAULT_SETTINGS = {
  apiKey: "",
  voiceName: "en-US-Chirp3-HD-Achernar",
  languageCode: "en-US",
  speakingRate: "1"
};

const apiKeyInput = document.getElementById("apiKey");
const voiceNameInput = document.getElementById("voiceName");
const languageCodeInput = document.getElementById("languageCode");
const speakingRateInput = document.getElementById("speakingRate");
const saveButton = document.getElementById("save");
const status = document.getElementById("status");

init();

async function init() {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);

  apiKeyInput.value = settings.apiKey || "";
  voiceNameInput.value = settings.voiceName || DEFAULT_SETTINGS.voiceName;
  languageCodeInput.value = settings.languageCode || DEFAULT_SETTINGS.languageCode;
  speakingRateInput.value = String(settings.speakingRate || DEFAULT_SETTINGS.speakingRate);
}

saveButton.addEventListener("click", async () => {
  await chrome.storage.sync.set({
    apiKey: apiKeyInput.value.trim(),
    voiceName: voiceNameInput.value.trim() || DEFAULT_SETTINGS.voiceName,
    languageCode: languageCodeInput.value.trim() || DEFAULT_SETTINGS.languageCode,
    speakingRate: Number(speakingRateInput.value)
  });

  status.textContent = "Settings saved.";
  window.setTimeout(() => {
    status.textContent = "";
  }, 1500);
});
