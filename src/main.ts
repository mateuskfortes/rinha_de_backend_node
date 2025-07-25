const server = Bun.serve({
  port: 8080,
  async fetch(req) {
    if (req.method === "GET" && new URL(req.url).pathname === "/") {
      const response = await fetch(`${process.env.PROCESSOR_DEFAULT_URL}/payments/service-health`)
      const data = await response.json() as { failing: boolean }
      return new Response(`${data.failing}`, { status: 200 });
    }


    return new Response("Rota não encontrada", { status: 404 });
  },
});


console.log(`🚀 Servidor rodando em http://localhost:${server.port}`);