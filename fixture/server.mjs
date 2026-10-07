import { readFileSync } from "node:fs";
import { createServer } from "node:http";

// Minimal acceptance fixture. The served health state is a property of the checked-out commit.
const variant = JSON.parse(readFileSync(new URL("./variant.json", import.meta.url), "utf8"));
const port = Number(process.env.FIXTURE_PORT ?? "18080");
createServer((request, response) => {
  const send = () => {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ status: variant.status }));
  };
  if (request.url === "/health") send();
  else if (request.url === "/slow") setTimeout(send, 240_000);
  else {
    response.statusCode = 404;
    response.end();
  }
}).listen(port, "127.0.0.1", () => console.log(`fixture listening on ${port}`));
