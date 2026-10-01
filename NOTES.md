# NestJS ↔ Spring Boot — Notas de aprendizado (RioClubs Stats)

Atualizado à medida que cada conceito é implementado de verdade no código — nada escrito antes de existir o código correspondente. Cada seção segue o mesmo formato: **o que é** (explicação direta), **como fica no código** (trecho real do projeto), **equivalente em Spring** (a ponte com o que você já sabe), e **por que assim** (a decisão por trás, não só a definição).

**Índice:** [1. Módulos](#1-módulos-module) · [2. Providers e DI](#2-providers-e-injeção-de-dependência) · [3. Prisma](#3-prisma--spring-data-jpa--hibernate) · [4. Cron](#4-nestjsschedule-cron--scheduled) · [5. HttpService](#5-nestjsaxios-httpservice--resttemplatewebclient) · [6. Ingestão](#6-ingestão-de-dados-conceito-não-é-nestjs-específico) · [7. Pipes](#7-pipes--bean-validation-valid--validator) · [8. Guards](#8-guards--spring-security-filtrosinterceptores-de-autorização) · [9. Exception Filters](#9-exception-filters--restcontrolleradvice) · [10. Interceptors](#10-interceptors--aop-handlerinterceptor)

---

## 1. Módulos (`@Module`)

**O que é:** um módulo agrupa um conjunto de funcionalidades relacionadas — declara quais providers ele tem, quais controllers expõe, e quais outros módulos importa/exporta. É a unidade de organização básica do NestJS. **Regra de ouro:** bater o olho no `@Module({ imports: [...] })` do módulo raiz já mostra tudo que o backend oferece, sem precisar caçar pasta por pasta.

**Como fica no código** (`backend/src/app.module.ts`, o módulo raiz):

```ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // carrega variáveis de ambiente
    ScheduleModule.forRoot(),                  // habilita os jobs @Cron do projeto
    PrismaModule,                              // acesso ao banco
    IngestionModule,                           // busca e ingestão de dados externos
    ClubesModule,                              // endpoints de clubes/classificação
    PartidasModule,                            // endpoints de partidas
    AuthModule,                                // login/JWT
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Cada módulo de funcionalidade (`ClubesModule`, `IngestionModule`, etc.) segue o mesmo padrão em escala menor — agrupa só os controllers/providers daquela fatia:

```ts
// clubes.module.ts
@Module({
  controllers: [ClubesController],
  providers: [ClubesService],
})
export class ClubesModule {}
```

**Equivalente em Spring:** uma classe `@Configuration`, ou simplesmente um pacote Java com componentes que o component-scan descobre automaticamente. A diferença é que no NestJS a composição é **explícita** (você lista os imports no `@Module`), enquanto no Spring costuma ser implícita (scan automático do classpath).

**Por que assim:** o módulo raiz centraliza a composição da aplicação — é o "sumário" do projeto.

---

## 2. Providers e Injeção de Dependência

**O que é:** uma classe marcada com `@Injectable()` diz ao Nest "esse cara pode ser gerenciado pelo container" — o Nest cria a instância, resolve as dependências dela, e injeta onde for pedida via construtor. Sem `@Injectable()`, a classe é só uma classe TypeScript comum; o container não sabe que ela existe pra injetar em ninguém.

**Como fica no código** (`backend/src/prisma/prisma.service.ts`):

```ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  }
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
```

E quem precisa dele só declara no construtor — nunca faz `new PrismaService()` na mão:

```ts
// clubes.service.ts
@Injectable()
export class ClubesService {
  constructor(private readonly prisma: PrismaService) {} // injetado automaticamente
}
```

`PrismaService` mora num módulo marcado `@Global()`, então fica disponível em **qualquer** outro módulo sem precisar importar explicitamente — bom pra algo usado em praticamente todo lugar, como acesso a banco.

**Equivalente em Spring:** um bean gerenciado pelo container (`@Service`, `@Component`, `@Repository`), injetado via construtor num outro bean. `@Injectable()` ≈ `@Service`/`@Component`.

**Por que assim:** a classe que consome `PrismaService` não precisa saber como ele é construído (adapter, connection string) — só declara que precisa dele. Isso desacopla e facilita trocar a implementação/mockar em teste.

---

## 3. Prisma ↔ Spring Data JPA / Hibernate

**O que é:** Prisma é um ORM — mapeia o `schema.prisma` (modelos + relações) para um client TypeScript tipado (`PrismaClient`), gerado automaticamente, com métodos como `.findMany()`, `.upsert()`.

**Como fica no código** (`backend/prisma/schema.prisma`):

```prisma
model Clube {
  id            Int      @id @default(autoincrement())
  nome          String
  apiFootballId Int      @unique
  acompanhado   Boolean  @default(false)
  partidasCasa  Partida[] @relation("Mandante")
}
```

Isso gera métodos prontos, sem escrever nenhuma query SQL: `prisma.clube.findMany()`, `prisma.clube.upsert({ where, update, create })`, etc.

**Equivalente em Spring:** entidades JPA (`@Entity`) + `JpaRepository` — a diferença é que no Prisma o "repository" já vem pronto e tipado a partir do schema, sem precisar escrever uma interface por entidade.

**Pegadinha real que encontrei:** na versão do Prisma usada aqui (7.x), a URL de conexão **não fica mais no `schema.prisma`** — fica num `prisma.config.ts` separado (usado só pelas ferramentas de CLI, tipo migration). E o `PrismaClient` em tempo de execução exige um **driver adapter** explícito (`@prisma/adapter-pg`, que usa o `pg` por baixo), em vez de simplesmente ler a URL do ambiente sozinho:

```ts
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
```

Isso é conceitualmente parecido com escolher explicitamente um `DataSource`/driver JDBC no Spring, em vez de deixar tudo implícito no `application.yml` — só que o Prisma tornou isso **obrigatório e explícito no código**, não só configuração.

---

## 4. `@nestjs/schedule` (`@Cron`) ↔ `@Scheduled`

**O que é:** decorator que registra um método pra rodar automaticamente numa expressão cron, sem precisar de infraestrutura externa (tipo um cron job de sistema operacional) — o próprio processo Node dispara a execução no horário certo.

**Como fica no código** (`backend/src/ingestion/ingestion.service.ts`):

```ts
@Injectable()
export class IngestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly footballApi: FootballApiService,
  ) {}

  @Cron(process.env.INGESTION_CRON ?? '0 3 * * 0') // toda semana, domingo às 3h
  async executarAgendado() {
    await this.executar();
  }

  async executar() { /* busca e salva os jogos — ver seção 6 */ }
}
```

O `ScheduleModule.forRoot()` no módulo raiz é o que "liga" esse mecanismo — sem ele, o `@Cron` fica decorado mas nunca dispara.

**Equivalente em Spring:** `@Scheduled(cron = "...")`, exigindo `@EnableScheduling` na configuração. `ScheduleModule.forRoot()` aqui ≈ `@EnableScheduling` lá.

**A pegadinha real que encontrei, passo a passo** (essa é a melhor história técnica do projeto — mostra profundidade de verdade):

O problema: `@Cron(process.env.INGESTION_CRON ...)` usava uma variável de ambiente que, na hora H, estava **`undefined`**.

1. Um decorator como `@Cron(valor)` não é "mágica" — é só uma função que roda **no momento em que a classe é definida**, não quando a rota é chamada. Ou seja, `process.env.INGESTION_CRON` precisa já existir *antes* dessa linha executar.
2. Em módulos ES (o projeto inteiro usa `"type": "module"` no `package.json`), quando um arquivo `A.ts` importa `B.ts`, o Node executa **todo o `B.ts` primeiro**, do início ao fim, e só depois volta a executar o resto de `A.ts`.
3. Isso significa: `main.ts` importa `app.module.ts`. Mas `app.module.ts` importa `ingestion.module.ts`, que importa `ingestion.service.ts` — e o Node precisa terminar de avaliar **esse arquivo inteiro** (incluindo o `@Cron(...)` no topo da classe) antes de voltar pra `app.module.ts` e rodar a linha que chama `ConfigModule.forRoot({ isGlobal: true })`.
4. Resultado: o `@Cron` era avaliado **antes** do `ConfigModule` ter chance de carregar o `.env` — `process.env.INGESTION_CRON` chegava como `undefined` nesse ponto específico.

A correção: não dá pra confiar no `ConfigModule` pra esse caso, porque ele "carrega tarde demais" na ordem de import. A solução foi garantir que o `.env` já estivesse em `process.env` **antes de qualquer outro import acontecer** — colocando isso como a primeira linha de tudo, no `main.ts`:

```ts
// main.ts — a ordem das duas primeiras linhas importa MUITO
import 'dotenv/config';           // 1º: carrega o .env pro process.env
import { NestFactory } from '@nestjs/core';
// ... só depois vem o import do AppModule, que puxa o IngestionService com o @Cron
```

Como `import 'dotenv/config'` é a primeira linha, ele termina de rodar (populando `process.env`) antes do `import { AppModule }` seguinte começar a ser avaliado — e aí sim, quando o `@Cron` do `IngestionService` for avaliado lá no fundo da árvore de imports, a variável já existe.

**Por que isso importa:** não é um bug de lógica de negócio — é entender profundamente como módulos ES carregam (ordem de avaliação de imports), algo que a maioria dos devs nunca para pra pensar até esbarrar nisso na prática.

---

## 5. `@nestjs/axios` (`HttpService`) ↔ `RestTemplate`/`WebClient`

**O que é:** um wrapper do Nest em cima do Axios, exposto como provider injetável (`HttpService`), que retorna Observables (RxJS) em vez de Promises.

**Como fica no código** (`backend/src/ingestion/football-api.service.ts`):

```ts
constructor(private readonly http: HttpService, private readonly prisma: PrismaService) {}

async buscarPartidas(nomeTime: string) {
  const resposta = await firstValueFrom(          // converte Observable -> Promise
    this.http.get(`https://${this.host}/football-matches-search`, {
      params: { search: nomeTime },
      headers: { 'x-rapidapi-host': this.host, 'x-rapidapi-key': this.key },
    }),
  );
  return resposta.data?.response?.suggestions ?? [];
}
```

`firstValueFrom(...)` é o que permite usar `await` normalmente, em vez de lidar com `.subscribe()`.

**Equivalente em Spring:** `RestTemplate` (síncrono, mais antigo) ou `WebClient` (reativo, também baseado em streams — o paralelo com Observable é direto aqui).

---

## 6. Ingestão de dados (conceito, não é NestJS específico)

**O que é:** o processo de buscar dados de uma fonte externa e **persistir uma cópia própria** no banco, em vez de sempre consultar a fonte externa ao vivo a cada requisição do usuário.

**Como fica no código** (`ingestion.service.ts`, fluxo simplificado):

```ts
async executar() {
  const clubes = await this.prisma.clube.findMany({ where: { acompanhado: true } });
  for (const clube of clubes) {
    const partidas = await this.footballApi.buscarPartidas(clube.nome);
    for (const partida of partidas) await this.salvarPartida(partida); // upsert, idempotente
  }
  await this.prisma.ingestionLog.create({ data: { sucesso: true, partidasInseridas: total } });
}
```

**Por que fazer isso aqui:** três motivos práticos, todos reais no projeto:
1. **Orçamento de requisições** — a API externa só permite 100 chamadas por mês; se cada acesso ao dashboard disparasse uma chamada nova, o orçamento acabaria em minutos. Ingerindo periodicamente e servindo do banco, o número de chamadas fica sob controle total da aplicação.
2. **Desacoplamento de disponibilidade** — se a API externa cair, o dashboard continua respondendo com os dados já ingeridos.
3. **Idempotência** — como cada `Partida`/`Clube` tem um `apiFootballId` único, rodar a ingestão várias vezes não duplica dado (`upsert` atualiza se já existe, cria se não existe).

---

## 7. Pipes ↔ Bean Validation (`@Valid` + Validator)

**O que é:** um Pipe intercepta o valor de um parâmetro (query, body, param) **antes** dele chegar no método do controller, podendo transformar ou validar — se falhar, lança uma exceção e o método do controller **nunca é chamado**.

**Como fica no código** (`backend/src/common/pipes/zod-validation.pipe.ts`):

```ts
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}
  transform(value: unknown) {
    const resultado = this.schema.safeParse(value);
    if (!resultado.success) {
      throw new BadRequestException(resultado.error.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message })));
    }
    return resultado.data;
  }
}
```

Uso no controller — o mesmo pipe genérico, reaproveitado com schemas diferentes:

```ts
@Get('compare')
async comparar(@Query(new ZodValidationPipe(compararQuerySchema)) query: CompararQuery) { ... }
```

**Equivalente em Spring:** `@Valid` numa DTO anotada com Bean Validation (`@NotNull`, `@Min`, etc.) — intercepta antes do controller igual, e devolve 400 automaticamente se inválido.

**Detalhe confirmado na prática:** `z.enum(...)` no Zod 4 aceita tanto um array de strings quanto um objeto enum gerado pelo Prisma (`z.enum(StatusPartida)`) — não precisei converter manualmente.

**Por que assim:** sem o pipe, cada controller validaria na mão e a resposta de erro ficaria inconsistente entre endpoints. Testei na prática mandando `a=abc` (não numérico) e confirmando 400 estruturado, não um 500 genérico.

---

## 8. Guards ↔ Spring Security (filtros/interceptores de autorização)

**O que é:** um Guard decide, **antes** do controller ser chamado, se a requisição pode prosseguir. Diferente de um Pipe (que valida/transforma dados), o Guard decide **permissão de acesso**.

**Como fica no código:**

```ts
// jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// ingestion.controller.ts
@Post('run')
@UseGuards(JwtAuthGuard)
async executar() { return this.ingestionService.executar(); }
```

A validação de fato do token acontece em `jwt.strategy.ts` (Passport `Strategy`), registrada com o nome `'jwt'` — o Guard só aciona essa estratégia por nome e barra a requisição se ela falhar.

**Equivalente em Spring:** um filtro do Spring Security (`OncePerRequestFilter`) ou a configuração de `SecurityFilterChain`.

**Decisão de design:** as rotas de leitura (`/clubes`, `/partidas`) ficam **públicas de propósito** — dashboard público, sem dado sensível. Só `POST /ingestion/run` é protegido, porque consome o orçamento limitado da API externa.

---

## 9. Exception Filters ↔ `@RestControllerAdvice`

**O que é:** um Exception Filter intercepta qualquer exceção lançada em qualquer controller da aplicação e decide como ela vira resposta HTTP — status code, corpo, formato. Sem isso, cada controller trataria erro na mão (ou o Nest usaria o formato padrão dele, que é razoável mas não totalmente sob seu controle).

**Como fica no código** (`backend/src/common/filters/all-exceptions.filter.ts`):

```ts
@Catch() // sem argumento = captura qualquer exceção, não só um tipo específico
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = isHttpException ? extrairMensagem(exception) : 'Erro interno do servidor';

    if (!isHttpException) {
      this.logger.error(`Exceção não tratada em ${request.method} ${request.url}`, ...);
    }

    response.status(status).send({ statusCode: status, message, path: request.url, timestamp: new Date().toISOString() });
  }
}
```

Registrado globalmente no `main.ts`: `app.useGlobalFilters(new AllExceptionsFilter())`.

**Pegadinha real que encontrei:** quando você lança `new NotFoundException('Clube 9999 não encontrado')`, o Nest **já embrulha** essa string num objeto `{ message, error, statusCode }` antes de guardar como corpo da exceção. Se eu simplesmente fizesse `message: exception.getResponse()` no meu filtro, o resultado final ficava **aninhado** (`message: { message: "...", error: "Not Found", statusCode: 404 }`), duplicando `statusCode` e poluindo a resposta. Corrigi extraindo só o `.message` de dentro desse objeto (função `extrairMensagem`), achatando a resposta final.

**Equivalente em Spring:** exatamente o `@RestControllerAdvice` + `@ExceptionHandler` que você já construiu no GoValue (`ApiExceptionHandler`) — mesma ideia, um lugar só tratando todo erro da API, com exceções de domínio convertidas no status certo. A diferença é que no Nest um único `@Catch()` sem argumento já cobre "qualquer exceção", enquanto no Spring você registra um `@ExceptionHandler` por tipo de exceção (o que também dá pra fazer no Nest, com `@Catch(TipoEspecifico)`).

**Por que isso importa:** além de consistência, é a camada que impede um erro inesperado (bug genuíno, não uma regra de negócio violada) de vazar stack trace ou detalhe interno pro cliente — só exceções que eu mesmo lancei de propósito (`HttpException` e subclasses) retornam a mensagem original; qualquer outra coisa vira "Erro interno do servidor" genérico, com o detalhe de verdade só no log do servidor.

---

## 10. Interceptors ↔ AOP / `HandlerInterceptor`

**O que é:** um Interceptor envolve a execução do handler (o método do controller) — roda código **antes e depois** dele, podendo medir tempo, logar, transformar a resposta, ou até curto-circuitar a chamada (ex.: cache). É a peça do pipeline que fica "ao redor" da lógica de negócio, não dentro dela.

**Como fica no código** (`backend/src/common/interceptors/logging.interceptor.ts`):

```ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const { method, url } = request;
    const inicio = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duracaoMs = Date.now() - inicio;
        this.logger.log(`${method} ${url} — ${duracaoMs}ms`);
      }),
    );
  }
}
```

`next.handle()` é um Observable que só emite valor **depois** que o controller termina — por isso o `tap()` (que roda um efeito colateral sem alterar o valor) é o lugar certo pra medir "quanto tempo passou", em vez de medir só antes de chamar `next.handle()`.

Registrado globalmente no `main.ts`: `app.useGlobalInterceptors(new LoggingInterceptor())`.

**Equivalente em Spring:** `HandlerInterceptor` (`preHandle`/`postHandle`/`afterCompletion`) ou, de forma mais próxima ainda, um `@Around` advice de AOP — a ideia de "código que envolve a chamada real" é a mesma nos dois frameworks, só muda a API.

**Por que assim:** sem um interceptor global, pra logar toda requisição eu precisaria adicionar `this.logger.log(...)` manualmente em cada método de cada controller — fácil de esquecer em um novo endpoint. Com o interceptor, é automático pra qualquer rota nova que eu criar, sem precisar lembrar de nada.
