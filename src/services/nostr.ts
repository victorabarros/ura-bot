import "websocket-polyfill"
import NDK, { NDKEvent, NDKKind, NDKPrivateKeySigner } from "@nostr-dev-kit/ndk"
import { ISocialService, PostMessageResponse } from "./ISocialService"
import config from "../config"

const CONNECT_TIMEOUT_MS = 5_000
const PUBLISH_TIMEOUT_MS = 8_000

export class NostrService implements ISocialService {
  private ndk: NDK

  constructor() {
    this.ndk = new NDK({
      explicitRelayUrls: config.nostr.relayUrls,
      signer: new NDKPrivateKeySigner(config.nostr.privateKey),
    })
  }

  async postMessage(message: string): Promise<PostMessageResponse> {
    const text = message.trim()
    if (!text) throw new Error("Nostr: message cannot be empty")

    await this.connectWithTimeout()

    const event = new NDKEvent(this.ndk)
    event.content = text
    event.kind = NDKKind.Text

    await this.publishWithTimeout(event)

    return { id: event.id }
  }

  private connectWithTimeout(): Promise<void> {
    return Promise.race([
      this.ndk.connect(CONNECT_TIMEOUT_MS),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error("Nostr: relay connection timed out")), CONNECT_TIMEOUT_MS)
      ),
    ])
  }

  private publishWithTimeout(event: NDKEvent): Promise<void> {
    return Promise.race([
      event.publish().then(() => undefined),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error("Nostr: publish timed out")), PUBLISH_TIMEOUT_MS)
      ),
    ])
  }
}
