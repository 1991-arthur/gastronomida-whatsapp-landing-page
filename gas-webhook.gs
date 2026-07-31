/**
 * Webhook para Google Sheets — Gastronomida
 *
 * Como implantar:
 * 1. Acesse https://script.google.com e crie um novo projeto
 * 2. Cole este código no editor
 * 3. Clique em "Implantar" > "Nova implantação" > "App da Web"
 * 4. Em "Executar como", escolha "Eu"
 * 5. Em "Quem tem acesso", escolha "Qualquer pessoa"
 * 6. Clique em "Implantar" e copie a URL gerada
 * 7. Cole essa URL em webhookUrl no arquivo script.js
 *
 * A planilha ativa do projeto será usada automaticamente.
 * A aba "Leads" será criada com os cabeçalhos na primeira execução.
 */

const SHEET_NAME = "Leads";

/**
 * Retorna uma mensagem amigável ao acessar via navegador.
 */
function doGet() {
  return json({
    status: "ok",
    message: "Webhook da Gastronomida ativo. Envie um POST com os dados do lead."
  });
}

/**
 * Recebe o lead via POST e adiciona uma linha na planilha.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();

    ensureHeaders(sheet);

    const row = buildRow(data);
    sheet.appendRow(row);

    return json({ success: true });
  } catch (error) {
    console.error("Erro ao processar lead:", error);
    return json({ success: false, error: error.toString() });
  }
}

/**
 * Garante que os cabeçalhos existam na primeira linha.
 */
function ensureHeaders(sheet) {
  const headers = [
    "Data/Hora",
    "Lead ID",
    "Nome",
    "Telefone",
    "Telefone (exibição)",
    "Página de origem",
    "Título da página",
    "Referrer",
    "User Agent",
    "UTM Source",
    "UTM Medium",
    "UTM Campaign",
    "UTM Content",
    "UTM Term",
    "FBCLID"
  ];

  const range = sheet.getRange(1, 1, 1, headers.length);
  const firstRow = range.getValues()[0];

  if (firstRow.every(function (cell) { return cell === ""; })) {
    range.setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

/**
 * Mapeia os campos do payload para as colunas da planilha.
 */
function buildRow(data) {
  return [
    data.submitted_at || new Date().toISOString(),
    data.lead_id || "",
    data.name || "",
    data.phone || "",
    data.phone_display || "",
    data.source_page || "",
    data.page_title || "",
    data.referrer || "",
    data.user_agent || "",
    data.utm_source || "",
    data.utm_medium || "",
    data.utm_campaign || "",
    data.utm_content || "",
    data.utm_term || "",
    data.fbclid || ""
  ];
}

/**
 * Obtém ou cria a aba "Leads" na planilha ativa.
 */
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  return sheet;
}

/**
 * Retorna uma resposta JSON simples.
 */
function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
