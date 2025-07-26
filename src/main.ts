import pool from "./db";
import { getPaymentsSummary, getTransactions, postPayments } from "./routes";

pool.query('delete from transactions')

const server = Bun.serve({
  port: 8080,
  async fetch(req) {
    if (req.method === "GET" && new URL(req.url).pathname === "/") {
      const response = await fetch(`${process.env.PROCESSOR_DEFAULT_URL}/payments/service-health`)
      const data = await response.json() as { failing: boolean }
      return new Response(`${data.failing}`, { status: 200 });
    }

    if (req.method === "GET" && new URL(req.url).pathname === "/db") return await getTransactions()

    if (req.method === 'POST' && new URL(req.url).pathname === '/payments') return await postPayments(req)

    if (req.method === 'GET' && new URL(req.url).pathname === '/payments-summary') return await getPaymentsSummary()

    return new Response("Rota não encontrada", { status: 404 });
  },
});


console.log(`🚀 Servidor rodando em http://localhost:${server.port}`);