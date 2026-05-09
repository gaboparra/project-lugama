async function loadNewSong() {
  document.getElementById("song-info").style.display = "none";
  document.getElementById("guess-input").value = "";
  document.getElementById("guess-input").disabled = false;

  try {
    let url = `${API_URL}/songs/random`;

    if (selectedGenre) {
      url += `?genre=${selectedGenre}`;
    }

    const res = await fetch(url, {
      headers: getHeaders(),
    });

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
    const res = await fetch(`${API_URL}/songs/validate`, {
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
      msg.innerText = "¡Correcto!";

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
  if (currentAttempt >= MAX_ATTEMPTS) {
    return;
  }

  currentAttempt++;

  refreshUI();
  updateAudioLimit();
}

async function handleSearch(query) {
  if (query.length < 2) return;

  const res = await fetch(`${API_URL}/songs/search?q=${query}`, {
    headers: getHeaders(),
  });

  const songs = await res.json();

  const list = document.getElementById("songs-list");

  list.innerHTML = "";

  songs.forEach((song) => {
    const option = document.createElement("option");

    option.value = song.title;

    list.appendChild(option);
  });
}

function showFinalData(songData) {
  document.getElementById("guess-input").disabled = true;
  document.getElementById("song-info").style.display = "flex";
  document.getElementById("album-cover").src = songData.albumCover;
  document.getElementById("song-details").innerText =
    `${songData.title} - ${songData.artist}`;
}
