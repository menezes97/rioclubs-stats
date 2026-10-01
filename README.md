# RioClubs Stats

Dashboard comparativo dos times cariocas (Fluminense, Flamengo, Vasco, Botafogo), com dados reais de jogos, classificação e estatísticas de temporada.

## Sobre o projeto

Projeto pessoal de aprendizado prático em NestJS, construído a partir de um domínio que eu curto de verdade (futebol carioca).

## Stack

- **Backend:** NestJS + Fastify + Zod + Prisma + PostgreSQL
- **Frontend:** Next.js (App Router)
- **Dados:** [Free API Live Football Data](https://rapidapi.com/Creativesdev/api/free-api-live-football-data) (via RapidAPI), ingeridos periodicamente por um job agendado e persistidos localmente

## Como rodar

Pré-requisitos: Node.js 22+, Docker (só para o Postgres).

```bash
# 1. Suba o Postgres
docker compose up -d db

# 2. Configure o ambiente
cp backend/.env.example backend/.env
# preencha API_FOOTBALL_KEY (conta gratuita em rapidapi.com, assine o plano Basic da API "Free API Live Football Data")

# 3. Instale as dependências e rode as migrations
cd backend
npm install
npx prisma migrate deploy
npx prisma db seed

# 4. Suba a API
npm run start:dev
```

A API sobe em `http://localhost:3000`. Documentação Swagger em `http://localhost:3000/docs`.

Login de teste (seed, apenas dev): `admin@rioclubs.dev` / `admin123` — usado só para autorizar `POST /ingestion/run`; os demais endpoints são públicos.

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Sobe em `http://localhost:3001` (a 3000 já está com o backend).

## Testes

```bash
cd backend
npm test
```

Testes unitários (Vitest) cobrindo a lógica de comparação cabeça-a-cabeça, classificação, estatísticas de temporada, validação de entrada (Zod) e o tratamento global de erro — sem precisar de banco de dados rodando.
