export default {
    async fetch(request: Request): Promise<Response> {
      const url = new URL(request.url)
  
      if (url.pathname === "/api/health") {
        return Response.json({
          ok: true,
          service: "richards-restaurant-api",
          runtime: "cloudflare-workers"
        })
      }
  
      return new Response("Not Found", { status: 404 })
    }
  }