import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { spawn, ChildProcess } from "child_process";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const FLASK_PORT = 5001;

let flaskProcess: ChildProcess | null = null;

function startFlaskBackend(): Promise<void> {
  return new Promise((resolve) => {
    console.log("Starting Python Flask ML backend...");
    flaskProcess = spawn("python3", ["backend/app.py"], {
      cwd: __dirname,
      env: {
        ...process.env,
        PYTHONPATH: __dirname,
        FLASK_PORT: String(FLASK_PORT),
        FLASK_HOST: "127.0.0.1",
        PYTHONUNBUFFERED: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    flaskProcess.stdout?.on("data", (data) => {
      console.log(`[Flask] ${data.toString().trim()}`);
      if (data.toString().includes("Starting ModelForge AI Flask Backend") || data.toString().includes("Running on")) {
        resolve();
      }
    });

    flaskProcess.stderr?.on("data", (data) => {
      console.error(`[Flask Error] ${data.toString().trim()}`);
    });

    flaskProcess.on("exit", (code) => {
      console.log(`Flask backend process exited with code ${code}`);
    });

    // Resolve after 1.5 seconds anyway
    setTimeout(() => resolve(), 1500);
  });
}

function stopFlaskBackend() {
  if (flaskProcess && !flaskProcess.killed) {
    console.log("Shutting down Flask backend...");
    flaskProcess.kill("SIGTERM");
  }
}

process.on("exit", stopFlaskBackend);
process.on("SIGINT", () => {
  stopFlaskBackend();
  process.exit();
});
process.on("SIGTERM", () => {
  stopFlaskBackend();
  process.exit();
});

async function startServer() {
  await startFlaskBackend();

  const app = express();

  // Forward /api requests directly to Flask backend
  app.use("/api", (req, res) => {
    const options: http.RequestOptions = {
      hostname: "127.0.0.1",
      port: FLASK_PORT,
      path: req.originalUrl,
      method: req.method,
      headers: {
        ...req.headers,
        host: `127.0.0.1:${FLASK_PORT}`,
      },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on("error", (err) => {
      console.error("Proxy error to Flask:", err.message);
      if (!res.headersSent) {
        res.status(502).json({
          success: false,
          error: "ML Backend unavailable or restarting. Please try again in a moment.",
        });
      }
    });

    req.pipe(proxyReq);
  });

  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ModelForge AI Full-Stack Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
