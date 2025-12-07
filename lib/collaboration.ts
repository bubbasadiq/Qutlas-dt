// Y.js CRDT and WebSocket provider setup for real-time collaboration
import * as Y from "yjs"
import { WebsocketProvider } from "y-websocket"

interface CollaborationConfig {
  roomName: string
  userId: string
  userName: string
  awareness?: boolean
}

export class CollaborationManager {
  private ydoc: Y.Doc
  private provider: WebsocketProvider | null = null
  private ymap: Y.Map<any>
  private yarray: Y.Array<any>

  constructor(config: CollaborationConfig) {
    this.ydoc = new Y.Doc()
    this.ymap = this.ydoc.getMap("workspace")
    this.yarray = this.ydoc.getArray("operations")

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3002"

    this.provider = new WebsocketProvider(wsUrl, config.roomName, this.ydoc, {
      connect: true,
      awareness: config.awareness !== false,
    })

    // Setup awareness for cursors and user info
    if (this.provider.awareness) {
      this.provider.awareness.setLocalState({
        userId: config.userId,
        userName: config.userName,
        cursor: null,
        color: this.getRandomColor(),
      })
    }
  }

  private getRandomColor(): string {
    const colors = ["#ffa400", "#2a2a72", "#6a6ad0", "#4a4aa0"]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  public setGeometry(assetId: string, geometry: any) {
    this.ymap.set(`geometry:${assetId}`, geometry)
  }

  public getGeometry(assetId: string): any {
    return this.ymap.get(`geometry:${assetId}`)
  }

  public addOperation(operation: any) {
    this.yarray.push([operation])
  }

  public onGeometryChange(callback: (event: Y.YMapEvent<any>) => void) {
    this.ymap.observe(callback)
  }

  public onOperationAdded(callback: (event: Y.YArrayEvent) => void) {
    this.yarray.observe(callback)
  }

  public updateCursor(position: { x: number; y: number }) {
    if (this.provider?.awareness) {
      const state = this.provider.awareness.getLocalState()
      this.provider.awareness.setLocalState({
        ...state,
        cursor: position,
      })
    }
  }

  public getCollaborators() {
    const collaborators: any[] = []
    if (this.provider?.awareness) {
      this.provider.awareness.getStates().forEach((state) => {
        collaborators.push(state)
      })
    }
    return collaborators
  }

  public destroy() {
    this.provider?.destroy()
    this.ydoc.destroy()
  }
}

export type { Y }
