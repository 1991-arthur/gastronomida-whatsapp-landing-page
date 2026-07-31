/*
  CONFIGURAÇÃO OBRIGATÓRIA
  1. Cole o link real do grupo em whatsappGroupUrl.
  2. Para salvar leads, informe um endpoint HTTPS em webhookUrl.
  3. Para usar o Pixel, informe o ID em metaPixelId.

  O webhook receberá JSON via POST. Veja o formato no README.
*/

const CONFIG = {
  whatsappGroupUrl: "https://chat.whatsapp.com/KfviHUK12gcKIKB6G3v9Hg",
  // Nota: mantendo parâmetros de rastreamento (s, p, ilr, amv) fora da URL
  // para não interferir no redirecionamento do WhatsApp
  webhookUrl: "",
  metaPixelId: "",
  redirectDelaySeconds: 3
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
const successModal = document.querySelector("#success-modal");
const privacyModal = document.querySelector("#privacy-modal");
const privacyButton = document.querySelector("#privacy-button");
const manualAccess = document.querySelector("#manual-access");
const countdownElement = document.querySelector("#countdown");

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

initMetaPixel(CONFIG.metaPixelId);
trackEvent("ViewContent", {
  content_name: "Landing Page Grupo WhatsApp Gastronomida"
});

function initMetaPixel(pixelId) {
  if (!pixelId || pixelId.includes("COLE")) return;

  /* Meta Pixel base code carregado dinamicamente */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
}

function trackEvent(eventName, parameters = {}) {
  if (typeof window.fbq === "function") {
    window.fbq("track", eventName, parameters);
  }
}

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

    trackEvent("Lead", {
      content_name: "Grupo WhatsApp Gastronomida"
    });

    trackEvent("CompleteRegistration", {
      content_name: "Grupo WhatsApp Gastronomida",
      status: "completed"
    });

    openSuccessModal();
  } catch (error) {
    console.error("Erro ao cadastrar lead:", error);
    formMessage.textContent =
      "Não foi possível concluir o cadastro agora. Tente novamente em instantes.";
  } finally {
    setLoading(false);
  }
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
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    keepalive: true
  });

  if (!response.ok) {
    throw new Error(`Webhook retornou HTTP ${response.status}`);
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

function openSuccessModal() {
  manualAccess.href = CONFIG.whatsappGroupUrl;
  successModal.classList.add("is-open");
  successModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  let remaining = Number(CONFIG.redirectDelaySeconds) || 3;
  countdownElement.textContent = remaining;

  const interval = window.setInterval(() => {
    remaining -= 1;
    countdownElement.textContent = Math.max(remaining, 0);

    if (remaining <= 0) {
      window.clearInterval(interval);
      window.location.assign(CONFIG.whatsappGroupUrl);
    }
  }, 1000);
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
