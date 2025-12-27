import { describe, it, expect, beforeEach } from 'vitest'
import { IntentHistory } from '../intent-history'
import type { GeometryIR } from '../intent-ast'

describe('IntentHistory', () => {
  let history: IntentHistory
  
  const createMockIR = (id: string): GeometryIR => ({
    part: 'test',
    operations: [{
      id,
      type: 'box',
      parameters: {},
      timestamp: Date.now()
    }],
    constraints: [],
    hash: `intent_${id}`
  })

  beforeEach(() => {
    history = new IntentHistory()
  })

  it('should start empty', () => {
    expect(history.current()).toBeNull()
    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(false)
  })

  it('should push and retrieve intent', () => {
    const ir = createMockIR('1')
    history.push(ir)
    
    expect(history.current()).toEqual(ir)
    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(false)
  })

  it('should handle undo', () => {
    const ir1 = createMockIR('1')
    const ir2 = createMockIR('2')
    
    history.push(ir1)
    history.push(ir2)
    
    expect(history.current()).toEqual(ir2)
    expect(history.canUndo()).toBe(true)
    
    const undone = history.undo()
    expect(undone).toEqual(ir1)
    expect(history.current()).toEqual(ir1)
    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(true)
  })

  it('should handle redo', () => {
    const ir1 = createMockIR('1')
    const ir2 = createMockIR('2')
    
    history.push(ir1)
    history.push(ir2)
    history.undo()
    
    expect(history.canRedo()).toBe(true)
    
    const redone = history.redo()
    expect(redone).toEqual(ir2)
    expect(history.current()).toEqual(ir2)
    expect(history.canRedo()).toBe(false)
  })

  it('should clear redo history on new push', () => {
    const ir1 = createMockIR('1')
    const ir2 = createMockIR('2')
    const ir3 = createMockIR('3')
    
    history.push(ir1)
    history.push(ir2)
    history.undo()
    
    expect(history.canRedo()).toBe(true)
    
    history.push(ir3)
    
    expect(history.canRedo()).toBe(false)
    expect(history.current()).toEqual(ir3)
  })

  it('should limit history size', () => {
    // Push more than max history (100)
    for (let i = 0; i < 150; i++) {
      history.push(createMockIR(`${i}`))
    }
    
    // Should only have last 100
    const current = history.current()
    expect(current?.hash).toBe('intent_149')
    
    // Should be able to undo through remaining history
    let undoCount = 0
    while (history.undo()) {
      undoCount++
    }
    
    expect(undoCount).toBeLessThanOrEqual(100)
  })

  it('should handle multiple undo/redo operations', () => {
    const ir1 = createMockIR('1')
    const ir2 = createMockIR('2')
    const ir3 = createMockIR('3')
    
    history.push(ir1)
    history.push(ir2)
    history.push(ir3)
    
    history.undo()
    history.undo()
    expect(history.current()).toEqual(ir1)
    
    history.redo()
    expect(history.current()).toEqual(ir2)
    
    history.redo()
    expect(history.current()).toEqual(ir3)
  })

  it('should return null when undo at beginning', () => {
    const ir = createMockIR('1')
    history.push(ir)
    
    const result = history.undo()
    expect(result).toBeNull()
    expect(history.current()).toEqual(ir)
  })

  it('should return null when redo at end', () => {
    const ir = createMockIR('1')
    history.push(ir)
    
    const result = history.redo()
    expect(result).toBeNull()
    expect(history.current()).toEqual(ir)
  })

  it('should clear history', () => {
    history.push(createMockIR('1'))
    history.push(createMockIR('2'))
    
    history.clear()
    
    expect(history.current()).toBeNull()
    expect(history.canUndo()).toBe(false)
    expect(history.canRedo()).toBe(false)
  })
})
