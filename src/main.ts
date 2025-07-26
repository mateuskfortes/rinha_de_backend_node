import pool from "./db";

async function insertt() {

  const sql = `
    INSERT INTO transactions (correlationId, amount, requestedAt, type)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  const values = [
    '4a7901b8-7d26-4d9d-aa19-4dc1c7cf60b3',       // correlationId (UUID)
    19.90,                                       // amount (NUMERIC)
    '2025-07-15T12:34:56.000Z',                  // requestedAt (TIMESTAMPTZ)
    'default'                                    // type (ENUM)
  ];

  try {
    const result = await pool.query(sql, values);
    console.log('Registro inserido:', result.rows[0]);
  } catch (error) {
    console.error('Erro ao inserir:', error);
  }
}
const server = Bun.serve({
  port: 8080,
  async fetch(req) {
    await insertt()
    if (req.method === "GET" && new URL(req.url).pathname === "/") {
      const response = await fetch(`${process.env.PROCESSOR_DEFAULT_URL}/payments/service-health`)
      const data = await response.json() as { failing: boolean }
      return new Response(`${data.failing}`, { status: 200 });
    }

    if (req.method === "GET" && new URL(req.url).pathname === "/db") {
      const response = await pool.query(`SELECT * FROM transactions`)
      return new Response(JSON.stringify({ rows: response.rows }), { status: 200 });
    }

    if (req.method === 'POST' && new URL(req.url).pathname === '/payments') {

    }

    return new Response("Rota não encontrada", { status: 404 });
  },
});


console.log(`🚀 Servidor rodando em http://localhost:${server.port}`);