import http, { IncomingMessage, ServerResponse } from 'http';
import logger from 'electron-log';

export function proxy(
  upstream: {
    host: string;
    port: number;
  },
  req: IncomingMessage,
  res: ServerResponse
) {
  const options = {
    hostname: upstream.host,
    port: upstream.port,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options, (proxyRes: IncomingMessage) => {
    res.writeHead(proxyRes.statusCode!, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  req.pipe(proxyReq, { end: true });

  proxyReq.once('error', (err) => {
    logger.error(`Error in proxy request: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Error occurred while processing the request.');
  });
}
