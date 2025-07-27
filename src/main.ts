import pool from "./db";
import { getPaymentsSummary, getTransactions, postPayments } from "./routes";
import { runHealthChecker } from "./workers";

runHealthChecker()

pool.query('delete from transactions')

const server = Bun.serve({
  port: 8080,
  async fetch(req) {
    if (req.method === "GET" && new URL(req.url).pathname === "/") {
      return new Response(`oi`, { status: 200 });
    }

    if (req.method === "GET" && new URL(req.url).pathname === "/db") return await getTransactions()

    if (req.method === 'POST' && new URL(req.url).pathname === '/payments') return await postPayments(req)

    if (req.method === 'GET' && new URL(req.url).pathname === '/payments-summary') return await getPaymentsSummary()

    return new Response("Rota não encontrada", { status: 404 });
  },
});


console.log(`🚀 Servidor rodando em http://localhost:${server.port}`);