function updateDots() {
  document.querySelectorAll("#dots .dot").forEach((dot, index) => {
    dot.className = "dot";

    if (index < currentAttempt - 1) {
      dot.classList.add("done");
    } else if (index === currentAttempt - 1) {
      dot.classList.add("active");
    }
  });
}

function buildSonglesBar() {
  const wrap = document.getElementById("songles-bar-wrap");

  if (!wrap) return;

  wrap.innerHTML = "";

  const totalTime = TIME_LIMITS[MAX_ATTEMPTS];

  const indicator = document.createElement("div");

  indicator.className = "songles-indicator";
  indicator.id = "songles-indicator";
  indicator.style.left = "0%";

  wrap.appendChild(indicator);

  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    const prev = TIME_LIMITS[i - 1] || 0;

    const duration = TIME_LIMITS[i] - prev;

    const width = (duration / totalTime) * 100;

    const segment = document.createElement("div");

    segment.className = "songles-segment";
    segment.id = `seg-${i}`;

    segment.style.flexBasis = `${width}%`;
    segment.style.flexGrow = "0";

    const fill = document.createElement("div");

    fill.className = "seg-fill";

    segment.appendChild(fill);

    wrap.appendChild(segment);
  }

  updateSonglesState();
}

function updateSonglesState() {
  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    const seg = document.getElementById(`seg-${i}`);

    if (!seg) continue;

    seg.className = "songles-segment";

    const fill = seg.querySelector(".seg-fill");

    if (fill) {
      fill.style.width = "0%";
    }

    if (i < currentAttempt) {
      seg.classList.add("done");
    } else if (i === currentAttempt) {
      seg.classList.add("active");
    }
  }

  const indicator = document.getElementById("songles-indicator");

  if (indicator) {
    indicator.style.left = "0%";
  }

  const timeText = document.getElementById("songles-time-text");

  if (timeText) {
    timeText.textContent = "0.0s";
  }
}

function togglePlay() {
  const audio = document.getElementById("song-preview");

  if (!audio) return;

  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
}

function setPlayIcon(playing) {
  document.getElementById("play-icon").style.display = playing
    ? "none"
    : "block";

  document.getElementById("pause-icon").style.display = playing
    ? "block"
    : "none";
}

function updateAudioLimit() {
  const audio = document.getElementById("song-preview");

  if (!audio) return;

  const limit = TIME_LIMITS[currentAttempt];

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  audio.onplay = () => {
    setPlayIcon(true);

    function animate() {
      const time = audio.currentTime;

      // ELEMENTOS VISUALES
      const fill = document.querySelector(`#seg-${currentAttempt} .seg-fill`);

      const indicator = document.getElementById("songles-indicator");

      const timeText = document.getElementById("songles-time-text");

      // Actualizar segundos
      if (timeText) {
        timeText.textContent = `${time.toFixed(1)}s`;
      }

      // Progreso del segmento actual
      const segmentStart = TIME_LIMITS[currentAttempt - 1] || 0;

      const segmentDuration = limit - segmentStart;

      const progress =
        Math.min((time - segmentStart) / segmentDuration, 1) * 100;

      if (fill) {
        fill.style.width = `${progress}%`;
      }

      // Mover triangulito
      if (indicator) {
        const totalDuration = TIME_LIMITS[MAX_ATTEMPTS];

        const left = Math.min(time / totalDuration, 1) * 100;

        indicator.style.left = `${left}%`;
      }

      // Límite alcanzado
      if (time >= limit) {
        audio.pause();

        audio.currentTime = 0;

        if (fill) {
          fill.style.width = "0%";
        }

        if (indicator) {
          indicator.style.left = "0%";
        }

        if (timeText) {
          timeText.textContent = "0.0s";
        }

        setPlayIcon(false);

        return;
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();
  };

  audio.onpause = () => {
    setPlayIcon(false);

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
}
