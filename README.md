# Landing page — Grupo de WhatsApp da Gastronomida

Landing page responsiva em HTML, CSS e JavaScript puro para captar nome e telefone antes de liberar o acesso ao grupo.

## Arquivos

- `index.html`: estrutura e conteúdo da landing page.
- `styles.css`: identidade visual e responsividade da landing page.
- `script.js`: validação, máscara de telefone, captura de UTMs, webhook e redirecionamento.
- `bio/`: página de links na bio (`/bio`) com a mesma identidade visual.
- `gas-webhook.gs`: script do Google Apps Script que salva leads no Google Sheets.
- `ARQUITETURA.md`: diagrama e descrição da arquitetura de tracking (GTM + Stape + Meta + GA4 + Google Sheets).
- `README.md`: configuração e publicação.

## Página de links na bio (`/bio`)

A pasta `bio/` é servida automaticamente em `https://gastronomida.netlify.app/bio` (o
Netlify publica `index.html` de subpastas em rotas próprias, sem precisar de configuração).
Ela reúne os links da Gastronomida no mesmo padrão visual da landing page, com a foto
`gastronomida-camile-cesta.webp` na composição do destaque.

### Editar os links

Abra `bio/index.html` e altere o `href` dos cartões em `.link-list`:

- **Grupo de ofertas no WhatsApp** — aponta para a landing page (`../?utm_source=instagram&utm_medium=profile&utm_campaign=link_na_bio`),
  que captura o lead antes de liberar o grupo. As UTMs ficam gravadas junto ao lead no Google Sheets.
- **WhatsApp** — pedidos e dúvidas (`https://wa.me/5547991900516`).
- **Peça pelo iFood** — delivery da padaria no iFood.
- **Avalie no Google** — link direto para a avaliação no Google.
- **Endereço** — link de localização no Google Maps.

Para adicionar outro link, duplique um bloco `<a class="link-card">` e preencha título, texto e `href`.

A página também tem a seção **Nosso manifesto** (o texto pode ser editado em `bio/index.html`)
e um **mapa do Google Maps** embutido (o `iframe` fica na seção `Onde estamos`).

A página `bio/` carrega o mesmo container GTM da landing (via Stape), então o `page_view`
do `/bio` também é medido em GA4 e na Meta.

## 1. Configure o link do grupo

Abra `script.js` e altere:

```js
whatsappGroupUrl: "https://chat.whatsapp.com/COLE_AQUI_O_LINK_DO_GRUPO"
```

Use o link de convite completo gerado no WhatsApp.

## 2. Configure o Google Sheets para salvar os leads

O jeito mais simples e gratuito de armazenar os leads é usando o Google Sheets com Apps Script.

### Passo a passo

**1. Crie uma planilha no Google Sheets**

Acesse [sheets.google.com](https://sheets.google.com) e crie uma planilha em branco.

**2. Abra o Apps Script**

No menu da planilha, vá em **Extensões > Apps Script**. Apague o código que aparecer.

**3. Cole o código do webhook**

Abra o arquivo `gas-webhook.gs` deste projeto, copie todo o conteúdo e cole no editor do Apps Script.

**4. Implante como App da Web**

- Clique em **Implantar > Nova implantação**.
- Em **Tipo**, selecione **App da Web**.
- Em **Executar como**, escolha **Eu**.
- Em **Quem tem acesso**, escolha **Qualquer pessoa**.
- Clique em **Implantar**.
- **Autorize** o acesso quando solicitado.
- **Copie a URL** gerada (termina em `/exec`).

**5. Cole a URL no script.js**

```js
webhookUrl: "https://script.google.com/macros/s/COLE_A_URL_AQUI/exec"
```

Pronto! Ao enviar o formulário, o lead aparecerá automaticamente na aba **Leads** da planilha, com os cabeçalhos criados na primeira execução.

### Alternativa: usar outro webhook

Se preferir usar Make, n8n, Zapier, Kommo ou um backend próprio, basta colocar a URL do endpoint no mesmo campo `webhookUrl`.

### JSON enviado ao webhook

```json
{
  "lead_id": "uuid",
  "name": "Nome do lead",
  "phone": "+5547999999999",
  "phone_display": "(47) 99999-9999",
  "consent": true,
  "consent_text": "Concordo em receber ofertas e novidades da Gastronomida pelo WhatsApp.",
  "source_page": "https://seudominio.com/?utm_source=instagram",
  "page_title": "Grupo exclusivo | Gastronomida",
  "referrer": "",
  "user_agent": "...",
  "submitted_at": "2026-07-31T12:00:00.000Z",
  "utm_source": "instagram",
  "utm_medium": "paid_social",
  "utm_campaign": "grupo_whatsapp",
  "utm_content": "video_01",
  "utm_term": "",
  "fbclid": "..."
}
```

O endpoint deve responder com status HTTP `200`, `201` ou outro status `2xx`.

## 3. UTMs sugeridas para o anúncio

```text
utm_source=instagram
utm_medium=paid_social
utm_campaign=grupo_whatsapp_gastronomida
utm_content={{ad.name}}
```

O `fbclid` e as UTMs são capturados automaticamente e enviados junto com o lead.

## 4. Teste antes de publicar

1. Preencha nome, telefone e aceite o consentimento.
2. Confirme que o botão permanece bloqueado enquanto algum campo estiver inválido.
3. Envie o formulário.
4. Confirme que o lead chegou ao destino.
5. Confirme o redirecionamento para o grupo.
6. Teste em iPhone, Android e desktop.

## 5. Publicação

A página pode ser publicada em:

- hospedagem da empresa;
- Hostinger;
- Netlify;
- Vercel;
- Cloudflare Pages;
- servidor WordPress, mantendo os três arquivos na mesma pasta.

O domínio, SSL e política de privacidade devem estar ativos antes do início da campanha.

## Observação sobre privacidade

O texto incluído é uma base operacional, não um parecer jurídico. A Gastronomida deve definir o controlador dos dados, finalidade, prazo de retenção, canal de atendimento e política de privacidade aplicável à campanha.
