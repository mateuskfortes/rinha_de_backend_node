import pool from "./db";
import { payment_processor_url } from "./workers";
import type { PaymentsBody } from "./types";

export async function getTransactions() {
  const response = await pool.query(`SELECT * FROM transactions`)
  return new Response(JSON.stringify({ rows: response.rows }), { status: 200 });
}

export async function postPayments(req: Request) {
  const body = await req.json() as PaymentsBody
  const correlationId = body?.correlationId
  const amount = body?.amount
  const requestedAt = new Date().toISOString()

  await fetch(`${payment_processor_url}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      correlationId, amount, requestedAt
    })
  })

  await pool.query(
    `INSERT INTO transactions (correlationId, amount, requestedAt, type) VALUES ($1, $2, $3, $4)`,
    [correlationId, amount, requestedAt, 'default']
  );

  return new Response('', { status: 204 });
}

export async function getPaymentsSummary() {
  const defaultDataResult = await pool.query(`
    SELECT 
      COUNT(*)::int as totalRequests, 
      TO_CHAR(SUM(amount), 'FM999999999.00') as totalAmount 
    FROM transactions
    WHERE type = 'default'
  `);

  const fallbackDataResult = await pool.query(`
    SELECT 
      COUNT(*)::int as totalRequests, 
      TO_CHAR(SUM(amount), 'FM999999999.00') as totalAmount 
    FROM transactions
    WHERE type = 'fallback'
  `);

  const content = {
    default: {
      totalRequests: defaultDataResult.rows[0].totalrequests,
      totalAmount: defaultDataResult.rows[0].totalamount
    },
    fallback: {
      totalRequests: fallbackDataResult.rows[0].totalrequests,
      totalAmount: fallbackDataResult.rows[0].totalamount
    }
  };
  return new Response(JSON.stringify(content), { status: 201 })
}