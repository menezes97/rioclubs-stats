import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const clubes = [
  {
    nome: 'Fluminense',
    apelido: 'Flu',
    apiFootballId: 9863,
    cidade: 'Rio de Janeiro',
    acompanhado: true,
    corPrimaria: '#8B0F2E',
    escudoUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/12/Fluminense_Football_Club.svg/330px-Fluminense_Football_Club.svg.png',
  },
  {
    nome: 'Flamengo',
    apelido: 'Mengão',
    apiFootballId: 9770,
    cidade: 'Rio de Janeiro',
    acompanhado: true,
    corPrimaria: '#D10A2A',
    escudoUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/96/Clube_de_Regatas_do_Flamengo_logo.svg/330px-Clube_de_Regatas_do_Flamengo_logo.svg.png',
  },
  {
    nome: 'Vasco da Gama',
    apelido: 'Vasco',
    apiFootballId: 10276,
    cidade: 'Rio de Janeiro',
    acompanhado: true,
    corPrimaria: '#F2F2F2',
    escudoUrl: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d2/CR_Vasco_da_Gama.svg/330px-CR_Vasco_da_Gama.svg.png',
  },
  {
    nome: 'Botafogo',
    apelido: 'Fogão',
    apiFootballId: 8517,
    cidade: 'Rio de Janeiro',
    acompanhado: true,
    corPrimaria: '#9CA3AF',
    escudoUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/Botafogo_de_Futebol_e_Regatas_logo.svg/330px-Botafogo_de_Futebol_e_Regatas_logo.svg.png',
  },
];

async function main() {
  for (const clube of clubes) {
    await prisma.clube.upsert({
      where: { apiFootballId: clube.apiFootballId },
      update: clube,
      create: clube,
    });
  }
  console.log(`Seed concluído: ${clubes.length} clubes.`);

  const senhaHash = await bcrypt.hash('admin123', 10);
  await prisma.usuario.upsert({
    where: { email: 'admin@rioclubs.dev' },
    update: {},
    create: { email: 'admin@rioclubs.dev', senhaHash },
  });
  console.log('Seed concluído: usuário admin@rioclubs.dev / admin123 (dev only).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
