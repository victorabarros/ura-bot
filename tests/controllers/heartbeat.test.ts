import { Request, Response } from "express"
import { heartbeat } from "../../src/controllers/heartbeat"

function makeMockRes() {
  const json = jest.fn().mockReturnThis()
  const status = jest.fn().mockReturnValue({ json })
  return { res: { status, json } as unknown as Response, status, json }
}

const req = {} as Request

describe("heartbeat", () => {
  it("responds 200 with success: true and a version string", async () => {
    const { res, status, json } = makeMockRes()
    await heartbeat(req, res)
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, version: expect.any(String) })
    )
  })

  it("version is a non-empty string", async () => {
    const { res, json } = makeMockRes()
    await heartbeat(req, res)
    const body = json.mock.calls[0][0] as { success: boolean; version: string }
    expect(typeof body.version).toBe("string")
    expect(body.version.length).toBeGreaterThan(0)
  })
})
