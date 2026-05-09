async function fetchGenres() {
  try {
    const res = await fetch(`${API_URL}/songs/genres`, {
      headers: getHeaders(),
    });

    const genres = await res.json();

    const select = document.getElementById("genre-select");

    select.innerHTML = '<option value="">Aleatorio</option>';

    genres.forEach((genre) => {
      const option = document.createElement("option");

      option.value = genre;
      option.textContent = genre;

      select.appendChild(option);
    });
  } catch (err) {
    console.error(err);
  }
}

function changeGenre() {
  selectedGenre = document.getElementById("genre-select").value;

  loadNewSong();
}
