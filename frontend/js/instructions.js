function toggleInstructions() {
  const modal = document.getElementById("instructions-modal");

  modal.classList.toggle("show");
}

document.addEventListener("click", function (e) {
  const modal = document.getElementById("instructions-modal");

  const button = document.querySelector(".help-btn");

  if (!modal || !button) return;

  if (!modal.contains(e.target) && !button.contains(e.target)) {
    modal.classList.remove("show");
  }
});
