async function loadNewSong() {
  document.getElementById("song-info").style.display = "none";
  document.getElementById("guess-input").value = "";
  document.getElementById("guess-input").disabled = false;

  try {
    const res = await fetch(`/api/songs/random${selectedGenre ? `?genre=${selectedGenre}` : ""}`,
      {
        headers: getHeaders(),
      },
    );

    const song = await res.json();

    currentSongId = song._id;
    currentAttempt = 1;

    const audio = document.getElementById("song-preview");

    audio.src = song.previewUrl;
    audio.volume = 0.25;

    refreshUI();
    buildSonglesBar();
    updateAudioLimit();
  } catch (err) {
    console.error(err);
  }
}

function refreshUI() {
  const limit = TIME_LIMITS[currentAttempt];

  document.getElementById("attempt-count").innerText =
    `${currentAttempt} / ${MAX_ATTEMPTS}`;
  document.getElementById("current-limit-display").innerText = `${limit}s`;
  document.getElementById("feedback-message").innerText =
    `Intento ${currentAttempt}. Escuchás ${limit}s.`;

  updateDots();
  updateSonglesState();
}

async function handleCheck() {
  const answer = document.getElementById("guess-input").value;
  const msg = document.getElementById("feedback-message");
  try {
    const res = await fetch("/api/songs/validate", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        songId: currentSongId,
        answer,
        attempt: currentAttempt,
      }),
    });

    const data = await res.json();

    if (data.correct) {
      const star = data.starEarned ? " ⭐ ¡ESTRELLA!" : "";
      msg.innerText = `¡Correcto! +${data.pointsEarned} pts.${star}`;
      msg.style.color = "green";
      document.getElementById("user-points").innerText = data.totalPoints;
      document.getElementById("user-stars").innerText = data.totalStars;
      showFinalData(data.fullData);
      return;
    }

    if (currentAttempt < MAX_ATTEMPTS) {
      currentAttempt++;

      refreshUI();
      updateAudioLimit();

      msg.innerText = "Incorrecto.";
    } else {
      msg.innerText = "Game Over.";

      showFinalData(data.fullData);
    }
  } catch (err) {
    console.error(err);
  }
}

function handleSkip() {
  if (document.getElementById("guess-input").disabled) return;
  if (currentAttempt >= MAX_ATTEMPTS) {
    handleCheck();
  } else {
    currentAttempt++;
    refreshUI();
    updateAudioLimit();
    document.getElementById("guess-input").value = "";
  }
}

async function handleSearch(query) {
  if (query.length < 2) return;

  const res = await fetch(`/api/songs/search?q=${query}`, {
    headers: getHeaders(),
  });

  const songs = await res.json();

  const list = document.getElementById("songs-list");

  list.innerHTML = "";

  songs.forEach((song) => {
    const option = document.createElement("option");

    option.value = song.title;
    option.textContent = song.artist;
    list.appendChild(option);

    list.appendChild(option);
  });
}

function showFinalData(songData) {
  document.getElementById("guess-input").disabled = true;
  document.getElementById("song-info").style.display = "flex";
  document.getElementById("album-cover").src = songData.albumCover;
  document.getElementById("song-details").innerText =
    `${songData.title} - ${songData.artist}`;
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  document.getElementById("song-preview").onplay = null;
}
