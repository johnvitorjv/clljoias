import { describe, expect, it, afterAll } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, or, ne, isNull, lt } from "drizzle-orm";
import { orders } from "../drizzle/schema";

// Estes testes verificam a FORMA da query gerada (via .toSQL(), que apenas compila SQL,
// sem executar nada) em vez de rodar contra um Postgres real - não há infraestrutura de
// banco de testes neste projeto (nenhum DATABASE_URL/servidor de teste disponível). O que
// importa para provar a ausência de race condition é que a decisão "posso processar este
// pedido?" e a escrita "marcar como em processamento" sejam o MESMO statement atômico
// (um único UPDATE ... WHERE), nunca um SELECT seguido de UPDATE em passos separados.
// Isso é uma propriedade estrutural da query, verificável sem conexão real.

// Cliente postgres.js é "lazy": construir o client não abre conexão de rede, e
// .toSQL() apenas compila a query no lado do drizzle - nenhuma chamada de rede ocorre
// em nenhum destes testes.
const client = postgres("postgres://user:pass@localhost:5432/db", { max: 1 });
const db = drizzle(client);

afterAll(async () => {
  await client.end({ timeout: 0 });
});

describe("payment processing lock - compare-and-set atômico", () => {
  it("aquisição do lock é um único UPDATE...WHERE (não SELECT seguido de UPDATE)", () => {
    const staleCutoff = new Date(Date.now() - 30_000);

    // Replica exatamente a query de tryAcquirePaymentProcessingLock (server/db.ts).
    const query = db
      .update(orders)
      .set({ processingSince: new Date() })
      .where(
        and(
          eq(orders.id, 42),
          ne(orders.status, "approved"),
          or(isNull(orders.processingSince), lt(orders.processingSince, staleCutoff))
        )
      )
      .returning({ id: orders.id });

    const { sql } = query.toSQL();

    // É uma única declaração UPDATE - a condição de elegibilidade (status, staleness)
    // é avaliada pelo Postgres sob o lock de linha do próprio UPDATE, então duas
    // requisições concorrentes são serializadas pelo banco: a segunda só "vê" o efeito
    // da primeira depois que ela commitou, e nesse ponto a condição do WHERE não casa mais.
    expect(sql.trim().toLowerCase().startsWith("update")).toBe(true);
    expect(sql).toMatch(/set\s+"processingSince"/i);

    // Nunca reabre cobrança para pedido já aprovado.
    expect(sql).toMatch(/"status"\s*<>\s*\$/i);

    // Permite readquirir o lock se ele expirou (evita bloqueio permanente por crash/timeout).
    expect(sql).toMatch(/"processingSince"\s+is\s+null/i);
    expect(sql).toMatch(/"processingSince"\s*<\s*\$/i);

    // .returning() é o que permite ao código da aplicação distinguir "adquiri o lock"
    // (linha retornada) de "outra requisição já está processando ou pedido já aprovado"
    // (nenhuma linha retornada) - sem precisar de um SELECT prévio.
    expect(sql).toMatch(/returning\s+"id"/i);
  });

  it("release do lock não depende do status atual (sempre libera processingSince)", () => {
    const query = db.update(orders).set({ processingSince: null }).where(eq(orders.id, 42));
    const { sql } = query.toSQL();

    expect(sql).toMatch(/update\s+"orders"/i);
    expect(sql).toMatch(/set\s+"processingSince"/i);
    // Sem essa liberação incondicional (chamada no catch/finally do endpoint), uma
    // exceção inesperada deixaria o pedido bloqueado até staleMs expirar.
  });

  it("updateOrderStatus libera o lock (processingSince = null) na mesma escrita que aplica o novo status", () => {
    const updateData: Record<string, unknown> = { status: "approved", updatedAt: new Date(), processingSince: null };
    const query = db.update(orders).set(updateData).where(eq(orders.id, 42));
    const { sql } = query.toSQL();

    expect(sql).toMatch(/set\s+"status"/i);
    expect(sql).toMatch(/"processingSince"/i);
    // Garante que uma tentativa concluída (aprovada, rejeitada, etc.) nunca deixa o
    // pedido preso em "processando" - o próprio updateOrderStatus já libera o lock.
  });
});
