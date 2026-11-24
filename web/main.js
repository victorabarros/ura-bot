const links = document.querySelectorAll("a[href^='http']")

for (const link of links) {
  link.target = "_blank"
  link.rel = "noopener noreferrer"
}
