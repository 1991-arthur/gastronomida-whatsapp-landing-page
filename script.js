/*
  CONFIGURAÇÃO OBRIGATÓRIA
  1. Cole o link real do grupo em whatsappGroupUrl.
  2. Para salvar leads, informe um endpoint HTTPS em webhookUrl.

  O webhook receberá JSON via POST. Veja o formato no README.
*/

const CONFIG = {
  whatsappGroupUrl: "https://chat.whatsapp.com/KfviHUK12gcKIKB6G3v9Hg",
  // Nota: mantendo parâmetros de rastreamento (s, p, ilr, amv) fora da URL
  // para não interferir no redirecionamento do WhatsApp
  webhookUrl: "https://script.google.com/macros/s/AKfycbwyX7aiEBaJpDeqvEiusxRuGkItQTO60cQoH5Z0b0l-P1dwuV3WV6ty6f-m0jK3LS5JBA/exec",
};

const form = document.querySelector("#lead-form");
const nameInput = document.querySelector("#name");
const phoneInput = document.querySelector("#phone");
const consentInput = document.querySelector("#consent");
const honeypotInput = document.querySelector("#website");
const submitButton = document.querySelector("#submit-button");
const formMessage = document.querySelector("#form-message");
const nameError = document.querySelector("#name-error");
const phoneError = document.querySelector("#phone-error");
const privacyModal = document.querySelector("#privacy-modal");
const privacyButton = document.querySelector("#privacy-button");

document.querySelector("#current-year").textContent = new Date().getFullYear();

const queryParams = new URLSearchParams(window.location.search);
const trackingKeys = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid"
];

const trackingData = Object.fromEntries(
  trackingKeys.map((key) => [key, queryParams.get(key) || ""])
);

function normalizePhone(value) {
  return value.replace(/\D/g, "").slice(0, 11);
}

function formatBrazilianPhone(value) {
  const digits = normalizePhone(value);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function validateName(showError = false) {
  const value = nameInput.value.trim();
  const valid = value.length >= 2 && /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(value);

  if (showError) {
    nameInput.classList.toggle("is-invalid", !valid);
    nameError.textContent = valid ? "" : "Informe seu nome.";
  }

  return valid;
}

function validatePhone(showError = false) {
  const digits = normalizePhone(phoneInput.value);
  const valid = digits.length === 10 || digits.length === 11;

  if (showError) {
    phoneInput.classList.toggle("is-invalid", !valid);
    phoneError.textContent = valid
      ? ""
      : "Informe um WhatsApp válido com DDD.";
  }

  return valid;
}

function isFormValid() {
  return validateName(false) && validatePhone(false) && consentInput.checked;
}

function updateButtonState() {
  submitButton.disabled = !isFormValid();
}

phoneInput.addEventListener("input", () => {
  phoneInput.value = formatBrazilianPhone(phoneInput.value);
  validatePhone(phoneInput.value.length >= 14);
  updateButtonState();
});

nameInput.addEventListener("input", () => {
  if (nameInput.classList.contains("is-invalid")) validateName(true);
  updateButtonState();
});

consentInput.addEventListener("change", updateButtonState);

nameInput.addEventListener("blur", () => validateName(true));
phoneInput.addEventListener("blur", () => validatePhone(true));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formMessage.textContent = "";

  const nameIsValid = validateName(true);
  const phoneIsValid = validatePhone(true);

  if (!nameIsValid || !phoneIsValid || !consentInput.checked) {
    formMessage.textContent = "Revise os dados obrigatórios para continuar.";
    updateButtonState();
    return;
  }

  if (honeypotInput.value.trim()) {
    /* Interrompe bots sem revelar a validação */
    return;
  }

  if (!isGroupUrlConfigured()) {
    formMessage.textContent =
      "O link do grupo ainda não foi configurado no arquivo script.js.";
    return;
  }

  setLoading(true);

  const lead = buildLeadPayload();

  try {
    await saveLead(lead);
  } catch (error) {
    /* Falha no webhook não pode bloquear o acesso ao grupo */
    console.error("Erro ao salvar lead (redirecionamento mantido):", error);
  }

  setLoading(false);
  window.location.assign(CONFIG.whatsappGroupUrl);
});

function buildLeadPayload() {
  const phoneDigits = normalizePhone(phoneInput.value);

  return {
    lead_id: createLeadId(),
    name: nameInput.value.trim(),
    phone: `+55${phoneDigits}`,
    phone_display: phoneInput.value,
    consent: true,
    consent_text:
      "Concordo em receber ofertas e novidades da Gastronomida pelo WhatsApp.",
    source_page: window.location.href,
    page_title: document.title,
    referrer: document.referrer || "",
    user_agent: navigator.userAgent,
    submitted_at: new Date().toISOString(),
    ...trackingData
  };
}

function createLeadId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `lead-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function saveLead(payload) {
  /*
    Se não houver webhook configurado, a página continua funcionando
    e redireciona ao grupo, mas o lead NÃO será armazenado externamente.
  */
  if (!CONFIG.webhookUrl.trim()) {
    console.info("Modo demonstração. Lead não enviado:", payload);
    return;
  }

  const response = await fetch(CONFIG.webhookUrl, {
    method: "POST",
    headers: {
      // text/plain evita o preflight (OPTIONS) que o Apps Script responde 405;
      // o JSON segue no corpo e o doPost lê e.postData.contents normalmente.
      "Content-Type": "text/plain;charset=UTF-8"
    },
    body: JSON.stringify(payload),
    keepalive: true
  });

  if (!response.ok) {
    throw new Error(`Webhook retornou HTTP ${response.status}`);
  }

  /* O doPost devolve 200 com {success:false} quando algo falha no Apps
     Script (ex.: planilha indisponível) — detectar para não falhar em silêncio */
  const result = await response.json().catch(() => null);

  if (!result || result.success !== true) {
    const detail = result && result.error ? `: ${result.error}` : "";
    throw new Error(`Webhook não confirmou o salvamento do lead${detail}`);
  }
}

function isGroupUrlConfigured() {
  return (
    CONFIG.whatsappGroupUrl.startsWith("https://chat.whatsapp.com/") &&
    !CONFIG.whatsappGroupUrl.includes("COLE_AQUI")
  );
}

function setLoading(isLoading) {
  submitButton.classList.toggle("is-loading", isLoading);
  submitButton.disabled = isLoading || !isFormValid();
  form.setAttribute("aria-busy", String(isLoading));
}

function openPrivacyModal() {
  privacyModal.classList.add("is-open");
  privacyModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closePrivacyModal() {
  privacyModal.classList.remove("is-open");
  privacyModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  privacyButton.focus();
}

privacyButton.addEventListener("click", openPrivacyModal);

document.querySelectorAll("[data-close-modal]").forEach((element) => {
  element.addEventListener("click", closePrivacyModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && privacyModal.classList.contains("is-open")) {
    closePrivacyModal();
  }
});
