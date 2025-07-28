import pool from "./db";
import { payment_processor, payment_processor_url } from "./workers";
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

  const response = await fetch(`${payment_processor_url}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      correlationId, amount, requestedAt
    })
  })

  if (response.ok) {
    await pool.query(
      `INSERT INTO transactions (correlationId, amount, requestedAt, type) VALUES ($1, $2, $3, $4)`,
      [correlationId, amount, requestedAt, payment_processor]
    );
  }

  return new Response('', { status: 204 });
}

export async function getPaymentsSummary(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const filters: string[] = [];
  const values: any[] = [];

  if (from) {
    filters.push(`requestedAt >= $${values.length + 1}`);
    values.push(from);
  }

  if (to) {
    filters.push(`requestedAt <= $${values.length + 1}`);
    values.push(to);
  }

  const filterClause = filters.length ? 'AND ' + filters.join(' AND ') : '';

  const defaultQuery = `
    SELECT 
      COUNT(*)::int as totalRequests, 
      SUM(amount) as totalAmount 
    FROM transactions
    WHERE type = 'default'
    ${filterClause}
  `;

  const fallbackQuery = `
    SELECT 
      COUNT(*)::int as totalRequests, 
      SUM(amount) as totalAmount 
    FROM transactions
    WHERE type = 'fallback'
    ${filterClause}
  `;

  const defaultDataResult = await pool.query(defaultQuery, values);
  const fallbackDataResult = await pool.query(fallbackQuery, values);

  const content = {
    default: {
      totalRequests: defaultDataResult.rows[0].totalrequests ?? 0,
      totalAmount: parseFloat(defaultDataResult.rows[0].totalamount) || 0
    },
    fallback: {
      totalRequests: fallbackDataResult.rows[0].totalrequests ?? 0,
      totalAmount: parseFloat(fallbackDataResult.rows[0].totalamount) || 0
    }
  };

  return new Response(JSON.stringify(content), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
