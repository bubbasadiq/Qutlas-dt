export interface ContextMenuPosition {
  x: number
  y: number
}

export interface ContextMenuAction {
  label: string
  icon?: string
  onClick: () => void
  disabled?: boolean
  divider?: boolean
}

export class ContextMenuManager {
  private position: ContextMenuPosition | null = null
  private actions: ContextMenuAction[] = []
  private target: 'object' | 'canvas' | 'edge' | null = null
  
  setPosition(x: number, y: number): void {
    this.position = { x, y }
  }
  
  setActions(actions: ContextMenuAction[]): void {
    this.actions = actions
  }
  
  setTarget(target: 'object' | 'canvas' | 'edge' | null): void {
    this.target = target
  }
  
  getPosition(): ContextMenuPosition | null {
    return this.position
  }
  
  getActions(): ContextMenuAction[] {
    return this.actions
  }
  
  getTarget(): string | null {
    return this.target
  }
  
  clear(): void {
    this.position = null
    this.actions = []
    this.target = null
  }
}