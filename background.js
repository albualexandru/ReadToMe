const CONTEXT_MENU_ID = "readtome_speak_selection";
const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";

const DEFAULT_SETTINGS = {
  apiKey: "",
  voiceName: "en-US-Chirp3-HD-Achernar",
  languageCode: "en-US",
  speakingRate: 1
};

let creatingOffscreenDocument;

chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
});

chrome.runtime.onStartup.addListener(() => {
  createContextMenu();
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !info.selectionText) {
    return;
  }

  const text = info.selectionText.trim();
  if (!text) {
    return;
  }

  try {
    const settings = await readSettings();

    if (!settings.apiKey) {
      await chrome.runtime.openOptionsPage();
      throw new Error("Google Cloud API key is missing. Set it in extension options.");
    }

    const audioContent = await synthesizeText(text, settings);
    await ensureOffscreenDocument();
    await chrome.runtime.sendMessage({
      type: "PLAY_AUDIO",
      audioContent
    });
  } catch (error) {
    console.error("ReadToMe failed:", error);
  }
});

function createContextMenu() {
  chrome.contextMenus.remove(CONTEXT_MENU_ID, () => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: "Read selected text aloud (Google Chirp)",
      contexts: ["selection"]
    });
  });
}

async function readSettings() {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    speakingRate: Number(settings.speakingRate) || DEFAULT_SETTINGS.speakingRate
  };
}

async function synthesizeText(text, settings) {
  const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(settings.apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: {
        text
      },
      voice: {
        languageCode: settings.languageCode,
        name: settings.voiceName
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: settings.speakingRate
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google TTS request failed (${response.status}): ${errorText}`);
  }

  const payload = await response.json();

  if (!payload.audioContent) {
    throw new Error("Google TTS response did not include audioContent.");
  }

  return payload.audioContent;
}

async function ensureOffscreenDocument() {
  if (await hasOffscreenDocument()) {
    return;
  }

  if (!creatingOffscreenDocument) {
    creatingOffscreenDocument = chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
      justification: "Play synthesized text-to-speech audio."
    }).finally(() => {
      creatingOffscreenDocument = undefined;
    });
  }

  await creatingOffscreenDocument;
}

async function hasOffscreenDocument() {
  if (!chrome.runtime.getContexts) {
    return false;
  }

  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)]
  });

  return contexts.length > 0;
}
