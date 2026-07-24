import { buildServer } from "./server.js";
import { config } from "./config.js";

const app = await buildServer();

app
  .listen({ port: config.port, host: config.host })
  .then((addr) => app.log.info(`API listening on ${addr}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
