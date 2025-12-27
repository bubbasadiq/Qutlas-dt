import { describe, it, expect } from 'vitest'
import { IntentCompiler } from '../intent-compiler'
import { hashGeometryIR } from '../intent-ast'
import type { WorkspaceObject } from '@/hooks/use-workspace'

describe('IntentCompiler', () => {
  it('should compile empty workspace', () => {
    const compiler = new IntentCompiler()
    const result = compiler.compileWorkspace({})
    
    expect(result.part).toBe('workspace_part')
    expect(result.operations).toHaveLength(0)
    expect(result.constraints).toHaveLength(2)
    expect(result.hash).toBeTruthy()
  })

  it('should compile workspace with single box', () => {
    const compiler = new IntentCompiler()
    const objects: Record<string, WorkspaceObject> = {
      'box1': {
        id: 'box1',
        type: 'box',
        dimensions: { width: 100, height: 100, depth: 100 },
        material: 'aluminum',
        visible: true,
        selected: false
      }
    }
    
    const result = compiler.compileWorkspace(objects)
    
    expect(result.operations).toHaveLength(1)
    expect(result.operations[0]).toMatchObject({
      id: 'box1',
      type: 'box',
      parameters: {
        width: 100,
        height: 100,
        depth: 100
      }
    })
    // Material is a string, not a number, so it's not included in parameters
    expect(result.operations[0].parameters).not.toHaveProperty('material')
  })

  it('should generate different hashes for different objects', () => {
    const compiler = new IntentCompiler()
    
    const objects1: Record<string, WorkspaceObject> = {
      'box1': {
        id: 'box1',
        type: 'box',
        dimensions: { width: 100, height: 100, depth: 100 },
        visible: true,
        selected: false
      }
    }
    
    const objects2: Record<string, WorkspaceObject> = {
      'box1': {
        id: 'box1',
        type: 'box',
        dimensions: { width: 200, height: 100, depth: 100 },
        visible: true,
        selected: false
      }
    }
    
    const result1 = compiler.compileWorkspace(objects1)
    const result2 = compiler.compileWorkspace(objects2)
    
    expect(result1.hash).not.toBe(result2.hash)
  })

  it('should generate same hash for same workspace', () => {
    const compiler = new IntentCompiler()
    
    const objects: Record<string, WorkspaceObject> = {
      'box1': {
        id: 'box1',
        type: 'box',
        dimensions: { width: 100, height: 100, depth: 100 },
        visible: true,
        selected: false
      }
    }
    
    const result1 = compiler.compileWorkspace(objects)
    const result2 = compiler.compileWorkspace(objects)
    
    expect(result1.hash).toBe(result2.hash)
  })

  it('should compile boolean operation intent', () => {
    const compiler = new IntentCompiler()
    
    const result = compiler.compileBooleanOp('union', 'box1', 'box2', 12345)
    
    expect(result.type).toBe('union')
    expect(result.target).toBe('box1')
    expect(result.operand).toBe('box2')
    expect(result.timestamp).toBe(12345)
  })

  it('should compile feature operation intent', () => {
    const compiler = new IntentCompiler()
    
    const result = compiler.compileFeatureOp('fillet', 'box1', { radius: 5 }, 12345)
    
    expect(result.type).toBe('fillet')
    expect(result.target).toBe('box1')
    expect(result.parameters).toEqual({ radius: 5 })
    expect(result.timestamp).toBe(12345)
  })

  it('should sort objects deterministically', () => {
    const compiler = new IntentCompiler()
    
    const objects1: Record<string, WorkspaceObject> = {
      'box2': {
        id: 'box2',
        type: 'box',
        dimensions: { width: 100, height: 100, depth: 100 },
        visible: true,
        selected: false
      },
      'box1': {
        id: 'box1',
        type: 'box',
        dimensions: { width: 100, height: 100, depth: 100 },
        visible: true,
        selected: false
      }
    }
    
    const objects2: Record<string, WorkspaceObject> = {
      'box1': {
        id: 'box1',
        type: 'box',
        dimensions: { width: 100, height: 100, depth: 100 },
        visible: true,
        selected: false
      },
      'box2': {
        id: 'box2',
        type: 'box',
        dimensions: { width: 100, height: 100, depth: 100 },
        visible: true,
        selected: false
      }
    }
    
    const result1 = compiler.compileWorkspace(objects1)
    const result2 = compiler.compileWorkspace(objects2)
    
    // Same objects in different order should produce same hash
    expect(result1.hash).toBe(result2.hash)
    
    // Operations should be in sorted order
    expect(result1.operations[0].id).toBe('box1')
    expect(result1.operations[1].id).toBe('box2')
    expect(result2.operations[0].id).toBe('box1')
    expect(result2.operations[1].id).toBe('box2')
  })
})

describe('hashGeometryIR', () => {
  it('should generate consistent hashes', () => {
    const ir = {
      part: 'test',
      operations: [],
      constraints: []
    }
    
    const hash1 = hashGeometryIR(ir)
    const hash2 = hashGeometryIR(ir)
    
    expect(hash1).toBe(hash2)
    expect(hash1).toMatch(/^intent_/)
  })

  it('should generate different hashes for different operations', () => {
    const ir1 = {
      part: 'test',
      operations: [{
        id: 'box1',
        type: 'box' as const,
        parameters: { width: 100 },
        timestamp: 12345
      }],
      constraints: []
    }
    
    const ir2 = {
      part: 'test',
      operations: [{
        id: 'box1',
        type: 'box' as const,
        parameters: { width: 200 },
        timestamp: 12345
      }],
      constraints: []
    }
    
    const hash1 = hashGeometryIR(ir1)
    const hash2 = hashGeometryIR(ir2)
    
    expect(hash1).not.toBe(hash2)
  })
})
