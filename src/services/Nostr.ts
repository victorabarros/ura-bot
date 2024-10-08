import "websocket-polyfill"
import NDK, { NDKEvent, NDKKind, NDKPrivateKeySigner } from "@nostr-dev-kit/ndk"
import { ISocialService, PostMessageResponse } from "./ISocialService"

type NostrServiceProps = {
    privateKey: string
    relayUrls: string[]
}

export class NostrService implements ISocialService {
    private ndk: NDK

  constructor(props: NostrServiceProps) {
    this.ndk = new NDK({
        explicitRelayUrls: props.relayUrls,
        signer: new NDKPrivateKeySigner(props.privateKey),
    })
  }

  async postMessage(message: string): Promise<PostMessageResponse> {
    await this.ndk.connect(2000)

    const event = new NDKEvent(this.ndk)
    event.content = message.trim()
    event.kind = NDKKind.Text

    await event.publish()

    return { id: "TODO" }
  }

}
