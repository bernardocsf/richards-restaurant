# Richard's Garden Restaurant — Plataforma Digital Premium

Projeto completo de frontend + backend para o **Richard's Garden Restaurant**, pensado como uma presença digital premium e pronta para evoluir.

## O que está incluído

### Frontend
- **Next.js 14 + TypeScript**
- **Tailwind CSS**
- **Framer Motion**
- design premium, editorial e responsivo
- homepage de alto impacto
- páginas de **Sobre**, **Menu**, **Reservas**, **Reviews**, **Contactos** e **Admin**
- menu organizado por categorias
- formulário de reservas com validação
- formulário de reviews com validação
- SEO base com metadata, Open Graph, sitemap e robots
- imagens reais do restaurante integradas no projeto

### Backend
- **Node.js + Express + TypeScript**
- **MongoDB Atlas + Mongoose**
- API REST organizada por **controllers**, **routes**, **services**, **models** e **validators**
- criação de reservas
- gestão/listagem de reservas
- criação de reviews
- listagem pública de reviews aprovadas
- moderação de reviews
- middleware simples de proteção admin por `x-admin-key`

## Estrutura do projeto

```bash
richards-restaurant-grill-platform/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── public/images/
├── backend/
│   ├── src/config/
│   ├── src/controllers/
│   ├── src/middleware/
│   ├── src/models/
│   ├── src/routes/
│   ├── src/services/
│   ├── src/validators/
│   └── src/scripts/
└── README.md
```

## Requisitos
- Node.js 18+
- npm 9+
- conta e cluster no **MongoDB Atlas**

## Configuração

### 1. Instalar dependências na raiz
```bash
npm install
```

### 2. Configurar variáveis de ambiente

#### Frontend
Criar `frontend/.env.local` a partir de `frontend/.env.example`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

#### Backend
Criar `backend/.env` a partir de `backend/.env.example`:

```bash
PORT=4000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/richards-restaurant-grill?retryWrites=true&w=majority
CLIENT_ORIGIN=http://localhost:3000
ADMIN_ACCESS_KEY=uma-chave-segura-aqui
```

## Executar em desenvolvimento

Na raiz:

```bash
npm run dev
```

Isto arranca:
- frontend em `http://localhost:3000`
- backend em `http://localhost:4000`

## Build de produção

```bash
npm run build
```

Depois:

```bash
npm run start --workspace backend
npm run start --workspace frontend
```

## Seed de dados

Para popular reservas e reviews iniciais:

```bash
npm run seed --workspace backend
```

## Endpoints principais

### Reservas
- `POST /api/reservations`
- `GET /api/reservations` *(admin)*
- `GET /api/reservations/:id` *(admin)*
- `PATCH /api/reservations/:id/status` *(admin)*
- `DELETE /api/reservations/:id` *(admin)*

### Reviews
- `POST /api/reviews`
- `GET /api/reviews` *(admin)*
- `GET /api/reviews/public`
- `PATCH /api/reviews/:id/approve` *(admin)*
- `DELETE /api/reviews/:id` *(admin)*

## Nota sobre a área admin
A área admin usa uma implementação simples com `x-admin-key` para acelerar a entrega e manter a solução funcional. Para produção real, recomenda-se evoluir para:
- autenticação com sessão/JWT
- perfis de utilizador
- rate limiting
- auditoria de ações

## Deploy sugerido

### Frontend
- Vercel
- Netlify

### Backend
- Render
- Railway
- Fly.io
- VPS com PM2 / Docker

### Base de dados
- MongoDB Atlas

## Melhorias futuras sugeridas
- autenticação robusta para admin
- CMS para edição do menu
- notificações por email para reservas
- integração com WhatsApp Business
- analytics de conversão
- bloqueio de horários indisponíveis
- internacionalização PT / EN

## Identidade visual aplicada
- fundo **charcoal/antracite**
- detalhes **champagne/dourado queimado**
- tipografia editorial + sans moderna
- animações suaves e discretas
- cartões premium com sombras e bordas subtis
- composição visual pensada para restaurante sofisticado em Lisboa
