import { redis } from 'bun';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

let payment_processor_url = process.env.PROCESSOR_DEFAULT_URL!;
let payment_processor = 'default';

declare var self: Worker;

self.onmessage = (event: MessageEvent) => {
  payment_processor_url = event.data.payment_processor_url;
  payment_processor = event.data.payment_processor;
};

(async () => {
  while (true) {
    const res = await redis.send("BRPOP", ["payment", "0"]);
    const payment = res?.[1];
    if (!payment) continue;

    let sent = false;

    while (!sent) {
      try {
        const response = await fetch(`${payment_processor_url}/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: payment,
        });

        if (response.ok) {
          const { correlationId, amount, requestedAt } = JSON.parse(payment);
          await pool.query(
            `INSERT INTO transactions (correlationId, amount, requestedAt, type) VALUES ($1, $2, $3, $4)`,
            [correlationId, amount, requestedAt, payment_processor]
          );
          sent = true;
        } else {
          console.error("Erro ao enviar pagamento:", await response.text());
        }
      } catch (err) {
        console.error("Erro ao enviar pagamento:", err);
        await Bun.sleep(1000); // espera antes de tentar de novo
      }
    }
  }
})();
