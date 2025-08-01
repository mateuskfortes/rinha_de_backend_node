import { redis } from 'bun';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  max: 1,
});

let payment_processor_url = process.env.PROCESSOR_DEFAULT_URL!;
let payment_processor = 'default';

declare var self: Worker;

self.onmessage = (event: MessageEvent) => {
  payment_processor_url = event.data.payment_processor_url;
  payment_processor = event.data.payment_processor;
};

async function processPayments(payments: string[]) {
  while (true) {
    const resultList: any[] = []
    const failures: string[] = []
    await Promise.all(
      payments.map(async (item: string) => {
        try {
          const response = await fetch(`${payment_processor_url}/payments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: item,
          })
          if (!response.ok) return
          const parsedItem = JSON.parse(item);
          resultList.push([
            parsedItem.correlationId,
            parsedItem.amount,
            parsedItem.requestedAt,
            payment_processor
          ])
        } catch (error) {
          failures.push(item)
          if (payment_processor === 'default') {
            payment_processor = 'fallback'
            payment_processor_url = process.env.PROCESSOR_FALLBACK_URL!
          }
          else {
            payment_processor = 'default'
            payment_processor_url = process.env.PROCESSOR_DEFAULT_URL!
          }
        }
      })
    );

    payments = failures

    if (resultList.length === 0) continue

    // Cria placeholders ($1, $2, $3, $4), ($5, $6, $7, $8), ...
    const placeholders = resultList
      .map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`)
      .join(", ");

    const flatValues = resultList.flat();

    try {
      await pool.query(
        `INSERT INTO transactions (correlationId, amount, requestedAt, type) VALUES ${placeholders}`,
        flatValues
      );
    } catch (error) { }

    if (payments.length === 0) return
  }
}

async function sendPayment() {
  while (true) {
    const count = 300;
    const res = await redis.send("EVAL", [
      `
      local result = {}
      for i = 1, tonumber(ARGV[1]) do
        local item = redis.call("LPOP", KEYS[1])
        if not item then break end
        table.insert(result, item)
      end
      return result
      `,
      "1", // número de keys
      "payment", // KEYS[1]
      String(count),  // ARGV[1]
    ]);

    if (!Array.isArray(res) || res.length === 0) {
      continue;
    }

    await processPayments(res)
  }
}

sendPayment();
