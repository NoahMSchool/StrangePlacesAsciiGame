// sound.js
// Simple global audio system

(function () {
  let enabled = true;
  let unlocked = false;

  let bgmAudio = null;
  let pendingBgm = null;

  function tryPlay(audio) {
    if (!audio || !enabled || !unlocked) return;
    audio.play().catch(() => {});
  }

  function ensureUnlocked() {
    if (unlocked) return;
    unlocked = true;

    if (pendingBgm) {
      playBgm(pendingBgm.url, pendingBgm.options);
    } else if (bgmAudio) {
      tryPlay(bgmAudio);
    }
  }

  function installUnlockHandlers() {
    const opts = { once: true, passive: true };
    const unlock = () => ensureUnlocked();
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
    window.addEventListener("touchstart", unlock, opts);
  }

  function setEnabled(v) {
    enabled = !!v;

    if (!enabled) {
      stopBgm();
    }
  }

  function playBgm(url, { loop = true, volume = 0.6 } = {}) {
    if (!enabled) return;

    pendingBgm = { url, options: { loop, volume } };

    // If already playing this track → do nothing
    if (bgmAudio && bgmAudio.src.includes(url)) {
      tryPlay(bgmAudio);
      return;
    }

    stopBgm();

    bgmAudio = new Audio(url);
    bgmAudio.loop = loop;
    bgmAudio.volume = volume;
    tryPlay(bgmAudio);
  }

  function stopBgm() {
    if (!bgmAudio) return;
    bgmAudio.pause();
    bgmAudio.currentTime = 0;
    bgmAudio = null;
  }

  function playSfx(url, volume = 1) {
    if (!enabled || !unlocked) return;

    const a = new Audio(url);
    a.volume = volume;
    tryPlay(a);
  }

  installUnlockHandlers();

  window.Sound = {
    setEnabled,
    playBgm,
    stopBgm,
    playSfx,
  };
})();
