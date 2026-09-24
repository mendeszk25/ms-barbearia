# MS Barbearia

Site oficial da MS Barbearia com layout desktop/mobile, galeria real, animações editoriais e fluxo de agendamento.

## Estrutura
- `index.html`: site público
- `styles.css`: layout desktop/mobile + estados de seleção múltipla
- `app.js`: galeria + seleção múltipla + fluxo de agendamento
- `admin.html`, `admin.css`, `admin.js`: painel administrativo (compatível com reservas de múltiplos serviços no modo local)
- `schema.sql`: estrutura Supabase com `appointment_services`, totais e proteção de colisão por intervalo

## Seleção múltipla
A seção **Escolha seu estilo** permite marcar mais de um serviço, calcula o total e leva a seleção para o agendamento. O fluxo interno usa a mesma seleção.

O modo local grava em `localStorage` e também bloqueia intervalos inteiros conforme a duração total. Reservas antigas de um único serviço continuam compatíveis.

## Supabase
O frontend ainda usa `localStorage` enquanto as credenciais/URL reais do projeto Supabase não estiverem configuradas no código. O `schema.sql` já prepara o modelo de produção para múltiplos serviços e cria o RPC `book_appointment_multi` com validação de sobreposição no banco.

Antes de publicar em produção, confirme no Supabase as **durações reais** de cada serviço e os horários de funcionamento. Nesta revisão, Corte usa 30 minutos e Luzes usa o exemplo explícito de 60 minutos; os demais mantêm o padrão atual de 30 minutos até serem confirmados.

## Privacidade
O site público não lista dados de clientes. O SQL não cria política pública de leitura para agendamentos nem para a relação de serviços de cada agendamento.
