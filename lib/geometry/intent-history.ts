import { GeometryIR } from './intent-ast'

export class IntentHistory {
  private stack: GeometryIR[] = []
  private index: number = -1
  
  push(ir: GeometryIR) {
    // Remove any redo history if we made a new change
    this.stack = this.stack.slice(0, this.index + 1)
    this.stack.push(ir)
    this.index++
    
    // Limit history size to prevent memory issues
    const MAX_HISTORY = 100
    if (this.stack.length > MAX_HISTORY) {
      this.stack = this.stack.slice(-MAX_HISTORY)
      this.index = this.stack.length - 1
    }
  }
  
  undo(): GeometryIR | null {
    if (this.index > 0) {
      this.index--
      return this.stack[this.index]
    }
    return null
  }
  
  redo(): GeometryIR | null {
    if (this.index < this.stack.length - 1) {
      this.index++
      return this.stack[this.index]
    }
    return null
  }
  
  current(): GeometryIR | null {
    return this.stack[this.index] || null
  }
  
  canUndo(): boolean {
    return this.index > 0
  }
  
  canRedo(): boolean {
    return this.index < this.stack.length - 1
  }
  
  clear() {
    this.stack = []
    this.index = -1
  }
}
