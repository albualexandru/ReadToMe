const player = document.getElementById("player");

chrome.runtime.onMessage.addListener(async (message) => {
  if (message?.type !== "PLAY_AUDIO" || !message.audioContent) {
    return;
  }

  player.pause();
  player.currentTime = 0;
  player.src = `data:audio/mp3;base64,${message.audioContent}`;

  try {
    await player.play();
  } catch (error) {
    console.error("Audio playback failed:", error);
  }
});
