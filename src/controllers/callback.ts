import { Request, Response } from "express"
import httpStatus from "http-status"
import axios from "axios"
import config from "../config"
import { cacheSet } from "../cache"

const TOKEN_URL = "https://api.x.com/2/oauth2/token"
const TOKEN_TTL = 60 * 60 * 2

/**
 * OAuth 2.0 PKCE redirect handler for X.
 *
 * X redirects here with ?code=<auth_code>&state=<state> after the user
 * authorises the app. This is a one-time setup flow; the resulting tokens
 * are persisted to Redis so the posting flow can use them.
 *
 * Required query params: code, code_verifier, redirect_uri
 * Optional: state (for CSRF verification — implement when adding a UI flow)
 */
export async function callback(req: Request, res: Response): Promise<void> {
  const { code, code_verifier, redirect_uri } = req.query

  if (!code || !code_verifier || !redirect_uri) {
    res.status(httpStatus.BAD_REQUEST).json({
      error: "Missing required query params: code, code_verifier, redirect_uri",
    })
    return
  }

  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: String(code),
      code_verifier: String(code_verifier),
      redirect_uri: String(redirect_uri),
    })

    const response = await axios.post<{
      access_token: string
      refresh_token: string
      token_type: string
      expires_in: number
    }>(TOKEN_URL, body.toString(), {
      auth: { username: config.x.clientId, password: config.x.clientSecret },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })

    const { access_token, refresh_token } = response.data

    await Promise.all([
      cacheSet("x_access_token", access_token, TOKEN_TTL),
      cacheSet("x_refresh_token", refresh_token, TOKEN_TTL),
    ])

    console.log("[callback] X OAuth tokens exchanged and stored")
    res.status(httpStatus.OK).json({ success: true })
  } catch (err) {
    const message = axios.isAxiosError(err)
      ? JSON.stringify(err.response?.data)
      : (err as Error).message
    console.error("[callback] Token exchange failed:", message)
    res.status(httpStatus.BAD_GATEWAY).json({ error: "Token exchange failed", detail: message })
  }
}
