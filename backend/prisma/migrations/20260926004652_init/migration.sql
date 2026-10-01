-- CreateEnum
CREATE TYPE "StatusPartida" AS ENUM ('AGENDADA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "Clube" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "apelido" TEXT,
    "escudoUrl" TEXT,
    "cidade" TEXT NOT NULL DEFAULT 'Rio de Janeiro',
    "apiFootballId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clube_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partida" (
    "id" SERIAL NOT NULL,
    "apiFootballId" INTEGER NOT NULL,
    "competicao" TEXT NOT NULL,
    "temporada" INTEGER NOT NULL,
    "rodada" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "status" "StatusPartida" NOT NULL DEFAULT 'AGENDADA',
    "mandanteId" INTEGER NOT NULL,
    "visitanteId" INTEGER NOT NULL,
    "golsMandante" INTEGER,
    "golsVisitante" INTEGER,
    "estadio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estatistica" (
    "id" SERIAL NOT NULL,
    "partidaId" INTEGER NOT NULL,
    "clubeId" INTEGER NOT NULL,
    "posseBola" INTEGER,
    "chutes" INTEGER,
    "chutesNoGol" INTEGER,
    "escanteios" INTEGER,
    "faltas" INTEGER,
    "cartoesAmarelos" INTEGER,
    "cartoesVermelhos" INTEGER,

    CONSTRAINT "Estatistica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionLog" (
    "id" SERIAL NOT NULL,
    "executadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sucesso" BOOLEAN NOT NULL,
    "partidasInseridas" INTEGER NOT NULL DEFAULT 0,
    "mensagem" TEXT,

    CONSTRAINT "IngestionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsoApiExterna" (
    "id" SERIAL NOT NULL,
    "data" DATE NOT NULL,
    "contagem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UsoApiExterna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Clube_apiFootballId_key" ON "Clube"("apiFootballId");

-- CreateIndex
CREATE UNIQUE INDEX "Partida_apiFootballId_key" ON "Partida"("apiFootballId");

-- CreateIndex
CREATE INDEX "Partida_mandanteId_visitanteId_idx" ON "Partida"("mandanteId", "visitanteId");

-- CreateIndex
CREATE UNIQUE INDEX "Estatistica_partidaId_clubeId_key" ON "Estatistica"("partidaId", "clubeId");

-- CreateIndex
CREATE UNIQUE INDEX "UsoApiExterna_data_key" ON "UsoApiExterna"("data");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- AddForeignKey
ALTER TABLE "Partida" ADD CONSTRAINT "Partida_mandanteId_fkey" FOREIGN KEY ("mandanteId") REFERENCES "Clube"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partida" ADD CONSTRAINT "Partida_visitanteId_fkey" FOREIGN KEY ("visitanteId") REFERENCES "Clube"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estatistica" ADD CONSTRAINT "Estatistica_partidaId_fkey" FOREIGN KEY ("partidaId") REFERENCES "Partida"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estatistica" ADD CONSTRAINT "Estatistica_clubeId_fkey" FOREIGN KEY ("clubeId") REFERENCES "Clube"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
