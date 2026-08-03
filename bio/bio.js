/* Página de links na bio — utilitários simples */

/* A classe .js é adicionada no <head> (index.html) para habilitar as
   animações de entrada sem flash — aqui só cuidamos do ano, das revelações
   e do modal de privacidade. */
document.querySelector("#current-year").textContent = new Date().getFullYear();

/* ---------- Modal de privacidade ---------- */

const privacyModal = document.querySelector("#privacy-modal");
const privacyButton = document.querySelector("#privacy-button");

function openPrivacyModal() {
  privacyModal.classList.add("is-open");
  privacyModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  privacyModal.querySelector(".modal-close")?.focus();
}

function closePrivacyModal() {
  privacyModal.classList.remove("is-open");
  privacyModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  if (privacyButton) privacyButton.focus();
}

/* Só liga os eventos quando os elementos existem — bio.js nunca deve quebrar a página */
if (privacyModal && privacyButton) {
  privacyButton.addEventListener("click", openPrivacyModal);

  document.querySelectorAll("[data-close-modal]").forEach((element) => {
    element.addEventListener("click", closePrivacyModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && privacyModal.classList.contains("is-open")) {
      closePrivacyModal();
    }
  });
}

/* Revela os elementos aos poucos conforme entram na tela */
const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealElements.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;
    observer.observe(element);
  });
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}
