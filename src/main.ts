const server = Bun.serve({
  port: 9999,
  fetch(req) {
    if (req.method === "GET" && new URL(req.url).pathname === "/") {
      return new Response("Olá, mundo!", { status: 200 });
    }

    return new Response("Rota não encontrada", { status: 404 });
  },
});

console.log(`🚀 Servidor rodando em http://localhost:${server.port}`);