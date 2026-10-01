-- Muda o orçamento de requisições de diário para mensal (limite real do provedor é 100/mês)
DROP INDEX "UsoApiExterna_data_key";
ALTER TABLE "UsoApiExterna" DROP COLUMN "data";
ALTER TABLE "UsoApiExterna" ADD COLUMN "mes" TEXT NOT NULL;
CREATE UNIQUE INDEX "UsoApiExterna_mes_key" ON "UsoApiExterna"("mes");
