# Landing page — Grupo de WhatsApp da Gastronomida

Landing page responsiva em HTML, CSS e JavaScript puro para captar nome e telefone antes de liberar o acesso ao grupo.

## Arquivos

- `index.html`: estrutura e conteúdo.
- `styles.css`: identidade visual e responsividade.
- `script.js`: validação, máscara de telefone, captura de UTMs, webhook, Pixel e redirecionamento.
- `README.md`: configuração e publicação.

## 1. Configure o link do grupo

Abra `script.js` e altere:

```js
whatsappGroupUrl: "https://chat.whatsapp.com/COLE_AQUI_O_LINK_DO_GRUPO"
```

Use o link de convite completo gerado no WhatsApp.

## 2. Configure onde os leads serão salvos

HTML e JavaScript no navegador não criam, sozinhos, um banco de dados seguro.  
Para armazenar nome, telefone e parâmetros de campanha, conecte a página a um endpoint.

No `script.js`, altere:

```js
webhookUrl: "https://seu-endpoint.com/webhook"
```

Pode ser um webhook do Make, n8n, Zapier, Google Apps Script, Kommo ou de um backend próprio.

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

## 3. Configure o Pixel da Meta

No `script.js`, altere:

```js
metaPixelId: "SEU_ID_DO_PIXEL"
```

Eventos implementados:

- `PageView`
- `ViewContent`
- `Lead`
- `CompleteRegistration`

Para campanhas com maior exigência de mensuração, use também a Conversions API no servidor ou na automação conectada ao webhook. Não coloque token de acesso da Meta no JavaScript público.

## 4. UTMs sugeridas para o anúncio

```text
utm_source=instagram
utm_medium=paid_social
utm_campaign=grupo_whatsapp_gastronomida
utm_content={{ad.name}}
```

O `fbclid` e as UTMs são capturados automaticamente e enviados junto com o lead.

## 5. Teste antes de publicar

1. Preencha nome, telefone e aceite o consentimento.
2. Confirme que o botão permanece bloqueado enquanto algum campo estiver inválido.
3. Envie o formulário.
4. Confirme que o lead chegou ao destino.
5. Confirme o redirecionamento para o grupo.
6. Teste em iPhone, Android e desktop.
7. Verifique os eventos com a extensão Meta Pixel Helper ou a ferramenta Testar eventos do Gerenciador de Eventos.

## 6. Publicação

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
