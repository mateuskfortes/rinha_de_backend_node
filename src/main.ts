import { isPropertyAccessExpression } from "typescript";
import pool from "./db";
import { getPaymentsSummary, getTransactions, postPayments } from "./routes";
import { runHealthChecker } from "./utils";
import { redis } from "bun";

const payment_processor_worker_list: Worker[] = []
for (let i = 0; i < Number(process.env.WORKERS || ''); i++) {
  const payment_processor_worker = new Worker(new URL("./worker.ts", import.meta.url))
  payment_processor_worker_list.push(payment_processor_worker)
}
runHealthChecker(payment_processor_worker_list)

const server = Bun.serve({
  port: 8080,
  async fetch(req) {
    if (req.method === "GET" && new URL(req.url).pathname === "/") {
      return new Response(`oi`, { status: 200 });
    }
    if (req.method === "GET" && new URL(req.url).pathname === "/clear") {
      await redis.send('FLUSHALL', [])
      await pool.query('delete from transactions')
      return new Response();
    }

    if (req.method === "GET" && new URL(req.url).pathname === "/db") return await getTransactions()

    if (req.method === 'POST' && new URL(req.url).pathname === '/payments') return await postPayments(req)

    if (req.method === 'GET' && new URL(req.url).pathname === '/payments-summary') return await getPaymentsSummary(req)

    return new Response("Rota não encontrada", { status: 404 });
  },
});


console.log(`🚀 Servidor rodando em http://localhost:${server.port}`);