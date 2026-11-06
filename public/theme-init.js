try {
  var savedTheme = localStorage.getItem("theme");
  var preferredTheme =
    savedTheme ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");
  document.documentElement.setAttribute("data-theme", preferredTheme);
} catch {
  document.documentElement.setAttribute("data-theme", "light");
}
