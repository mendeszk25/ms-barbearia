# MS Barbearia

Redesign visual baseado na referência fornecida, preservando a identidade e os dados reais disponíveis do projeto.

## Estrutura
- `index.html`: site público
- `styles.css`: layout desktop/mobile
- `app.js`: galeria + fluxo de agendamento
- `admin.html`, `admin.css`, `admin.js`: painel administrativo existente
- `schema.sql`: estrutura Supabase existente

## Observações
- O site público não expõe dados de clientes.
- O fluxo de agendamento do frontend continua usando `localStorage` enquanto um projeto Supabase real não estiver configurado no frontend.
- O número real de WhatsApp não foi fornecido no material do projeto; os botões de WhatsApp ficam sem destino real em vez de inventar um número.
