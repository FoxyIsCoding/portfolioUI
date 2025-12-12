import "https://esm.run/@material/web@latest/all.js";

const btn = document.getElementById("actionBtn");
const snackbar = document.getElementById("snackbar");
const themeToggle = document.getElementById("themeToggle");

btn?.addEventListener("click", () => {
  snackbar.labelText = "Button clicked";
  snackbar.open = true;
});

function setDarkMode(enabled) {
  document.documentElement.style.setProperty("color-scheme", enabled ? "dark" : "light");
  document.documentElement.classList.toggle("dark", enabled);
}

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
setDarkMode(prefersDark);

themeToggle.selected = prefersDark;

themeToggle.addEventListener("change", e => {
  setDarkMode(e.target.selected);
});
