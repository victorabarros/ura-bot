import { NextFunction, Request, Response } from "express"

const SENSITIVE_EXTENSIONS = new Set([
  ".bak",
  ".old",
  ".orig",
  ".save",
  ".swp",
  ".swo",
  ".tmp",
  ".sql",
  ".sqlite",
  ".sqlite3",
  ".db",
  ".pem",
  ".key",
  ".p12",
  ".pfx",
  ".php",
  ".asp",
  ".aspx",
  ".jsp",
  ".ini",
  ".log",
])

// Name fragments scanners use for env files, secrets, and private keys.
const SENSITIVE_NAME = /(?:^|[._-])(?:env|secrets?|credentials?|passwds?|password|wp-config|web\.config|id_rsa|id_dsa|id_ecdsa|id_ed25519)(?:[._-]|$)/i

/**
 * True when a URL path is a hidden-file, secret, or backup probe.
 * `/.well-known/...` stays open so certificate checks still work.
 */
export const isSensitiveProbePath = (rawPath: string): boolean => {
  const withoutQuery = rawPath.split("?")[0]?.split("#")[0] ?? ""
  if (withoutQuery.includes("\0") || withoutQuery.toLowerCase().includes("%00")) {
    return true
  }

  let decoded = withoutQuery
  let remainingDecodes = 2
  while (remainingDecodes > 0) {
    remainingDecodes -= 1
    try {
      const next = decodeURIComponent(decoded)
      if (next === decoded) break
      decoded = next
    } catch {
      break
    }
  }

  if (decoded.includes("\0")) return true

  const segments: string[] = []
  for (const segment of decoded.replace(/\\/g, "/").split("/")) {
    if (segment === "" || segment === ".") continue
    if (segment === "..") {
      if (segments.length === 0) return true
      segments.pop()
      continue
    }
    segments.push(segment)
  }

  const [first, ...rest] = segments
  const toCheck = first === ".well-known" ? rest : segments

  for (const segment of toCheck) {
    if (segment.startsWith(".")) return true
    if (segment.endsWith("~")) return true
    if (SENSITIVE_NAME.test(segment)) return true

    const pieces = segment.split(".")
    for (let i = 1; i < pieces.length; i++) {
      const extension = `.${pieces[i].toLowerCase()}`
      if (SENSITIVE_EXTENSIONS.has(extension)) return true
    }
  }

  return false
}

/**
 * Answers vulnerability-scanner paths with a plain 404.
 * Runs before static files, auth, and routes, and does not log the request.
 */
export const blockSensitivePaths = (req: Request, res: Response, next: NextFunction): void => {
  const rawUrl = req.originalUrl || req.url
  if (isSensitiveProbePath(req.path) || isSensitiveProbePath(rawUrl)) {
    res.status(404).type("text/plain").send("Not Found")
    return
  }
  next()
}
