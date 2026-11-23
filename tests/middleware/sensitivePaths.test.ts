import fs from "fs"
import http from "http"
import type { AddressInfo } from "net"
import path from "path"
import { isSensitiveProbePath } from "../../src/middleware/blockSensitivePaths"
import app from "../../src/app"

const PROBE_PATHS = [
  "/.env",
  "/.env.txt",
  "/.env.test",
  "/.env_bak",
  "/.env.vercel",
  "/.envrc",
  "/.gitlab-ci/.env",
  "/.streamlit/secrets.toml",
  "/.vscode/.env",
  "/.git/.env",
  "/.git/config",
  "/.git/HEAD",
  "/2024/.env",
  "/1password.env",
  "/admin/.env",
  "/admin/.env.production",
  "/api/.env",
  "/api/.env.local",
  "/%5C.%5C.env",
  "/.wp-config.php.swp",
  "/wp-config.php",
  "/web.config",
  "/backup/db.sql",
  "/id_rsa",
  "/secrets.toml",
  "/config.php.bak",
  "/%252eenv",
  "/.well-known/../.env",
]

const OPEN_PATHS = [
  "/",
  "/heartbeat",
  "/healthcheck",
  "/urabot/latest-post",
  "/urabot/stocks",
  "/urabot/news",
  "/urabot/reply-mentions",
  "/urabot/webhook",
  "/bitcoinmetrx/price",
  "/index.html",
  "/.well-known/acme-challenge/token",
  "/favicon.ico",
]

type HttpResult = {
  status: number
  body: string
  headers: http.IncomingHttpHeaders
}

const request = (
  server: http.Server,
  method: string,
  requestPath: string,
  headers: Record<string, string> = {},
  body?: string,
): Promise<HttpResult> => {
  const address = server.address() as AddressInfo
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: address.port,
        method,
        path: requestPath,
        headers,
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on("data", (chunk: Buffer) => chunks.push(chunk))
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
            headers: res.headers,
          })
        })
      },
    )
    req.on("error", reject)
    if (body !== undefined) req.write(body)
    req.end()
  })
}

describe("isSensitiveProbePath", () => {
  it.each(PROBE_PATHS)("flags %s", (probePath) => {
    expect(isSensitiveProbePath(probePath)).toBe(true)
  })

  it.each(OPEN_PATHS)("allows %s", (openPath) => {
    expect(isSensitiveProbePath(openPath)).toBe(false)
  })

  it("ignores the query string on a normal route", () => {
    expect(isSensitiveProbePath("/urabot/webhook?crc_token=abc")).toBe(false)
  })

  it("flags a null byte in the path", () => {
    expect(isSensitiveProbePath("/heartbeat%00.env")).toBe(true)
  })
})

describe("sensitive path HTTP responses", () => {
  let server: http.Server
  const publicDir = path.join(__dirname, "../../public")
  const wellKnownFile = path.join(publicDir, ".well-known/acme-challenge/probe-ok")
  const plantedEnv = path.join(publicDir, ".env")

  beforeAll((done) => {
    fs.mkdirSync(path.dirname(wellKnownFile), { recursive: true })
    fs.writeFileSync(wellKnownFile, "challenge-ok")
    fs.writeFileSync(plantedEnv, "API_KEY=should-not-leak")
    server = app.listen(0, "127.0.0.1", () => done())
  })

  afterAll((done) => {
    fs.rmSync(path.join(publicDir, ".well-known"), { recursive: true, force: true })
    fs.rmSync(plantedEnv, { force: true })
    server.close(() => done())
  })

  it.each(PROBE_PATHS)("returns a plain 404 for %s", async (probePath) => {
    const result = await request(server, "GET", probePath)
    expect(result.status).toBe(404)
    expect(result.body).toBe("Not Found")
    expect(result.headers["x-powered-by"]).toBeUndefined()
    expect(result.body).not.toMatch(/Express|Cannot GET|at\s+\//)
    expect(result.body).not.toContain("should-not-leak")
  })

  it("does not log probe requests", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => undefined)
    const error = jest.spyOn(console, "error").mockImplementation(() => undefined)
    await request(server, "GET", "/.env")
    const logged = [...log.mock.calls, ...error.mock.calls].flat().join(" ")
    expect(logged).not.toContain(".env")
    log.mockRestore()
    error.mockRestore()
  })

  it("still returns 404 when a probe includes an API key and a body", async () => {
    const result = await request(
      server,
      "POST",
      "/.env",
      { authorization: "test-api-key", "content-type": "application/json" },
      JSON.stringify({ hello: "world" }),
    )
    expect(result.status).toBe(404)
    expect(result.body).toBe("Not Found")
  })

  it("serves the home page", async () => {
    const result = await request(server, "GET", "/")
    expect(result.status).toBe(200)
    expect(result.headers["content-type"]).toContain("text/html")
    expect(result.body).toContain("UraBot")
    expect(result.headers["x-powered-by"]).toBeUndefined()
  })

  it("serves a file placed under /.well-known", async () => {
    const result = await request(server, "GET", "/.well-known/acme-challenge/probe-ok")
    expect(result.status).toBe(200)
    expect(result.body).toBe("challenge-ok")
  })

  it("returns 404 for a missing /.well-known file without asking for an API key", async () => {
    const result = await request(server, "GET", "/.well-known/acme-challenge/missing")
    expect(result.status).toBe(404)
    expect(result.body).toBe("Not Found")
    expect(result.body).not.toContain("API key")
  })

  it("keeps the heartbeat route working", async () => {
    const result = await request(server, "GET", "/heartbeat")
    expect(result.status).toBe(200)
    expect(JSON.parse(result.body)).toEqual({ success: true, version: expect.any(String) })
    expect(result.headers["x-powered-by"]).toBeUndefined()
  })

  it("keeps webhook validation working", async () => {
    const result = await request(server, "GET", "/urabot/webhook")
    expect(result.status).toBe(400)
    expect(JSON.parse(result.body)).toEqual({ error: "Missing crc_token" })
  })

  it("still requires an API key on action routes", async () => {
    const result = await request(server, "POST", "/urabot/stocks")
    expect(result.status).toBe(401)
    expect(JSON.parse(result.body).error).toEqual(expect.stringContaining("API key"))
  })

  it("returns 401 for an unknown path that is not a probe", async () => {
    const result = await request(server, "GET", "/not-a-real-route")
    expect(result.status).toBe(401)
  })
})
