// Operation Sequencer - Converts parsed intent into executable operations

export interface GeometryIntent {
  intent: string;
  baseGeometry: {
    type: string;
    parameters: Record<string, any>;
    position?: { x: number; y: number; z: number };
  };
  features?: Array<{
    type: string;
    name: string;
    parameters: Record<string, any>;
    description?: string;
  }>;
  material?: string;
  units?: string;
  manufacturability?: {
    processes: string[];
    complexity: string;
    warnings?: string[];
    constraints?: string[];
  };
  clarifications?: string[];
  confidence?: number;
}

export interface GeometryOperation {
  id: string;
  type: 'CREATE' | 'MODIFY' | 'FEATURE' | 'BOOLEAN' | 'ANALYZE' | 'EXPORT';
  operation: string;
  parameters: any;
  dependsOn: string[];
  streaming: boolean;
  description: string;
  estimatedTime?: number;
}

export class OperationSequencer {
  private operationCounter = 0;

  /**
   * Builds a sequence of executable operations from parsed intent
   * Operations are ordered by dependencies for correct execution
   */
  buildSequence(intent: GeometryIntent): GeometryOperation[] {
    const operations: GeometryOperation[] = [];

    // 1. Create base geometry
    const baseOp = this.createBaseGeometryOperation(intent.baseGeometry);
    operations.push(baseOp);

    // 2. Apply features
    if (intent.features && intent.features.length > 0) {
      for (const feature of intent.features) {
        const featureOp = this.createFeatureOperation(feature, baseOp.id);
        operations.push(featureOp);
      }
    }

    // 3. Add manufacturability analysis if needed
    if (intent.manufacturability) {
      const analysisOp = this.createAnalysisOperation(
        operations[operations.length - 1].id,
        intent.manufacturability
      );
      operations.push(analysisOp);
    }

    return operations;
  }

  /**
   * Creates operation for base geometry shape
   */
  private createBaseGeometryOperation(baseGeometry: any): GeometryOperation {
    const opId = this.generateOperationId();
    const { type, parameters, position } = baseGeometry;

    let operation: string;
    let description: string;

    switch (type.toLowerCase()) {
      case 'box':
        operation = 'CREATE_BOX';
        description = `Create box: ${parameters.width}×${parameters.height}×${parameters.depth}mm`;
        break;
      case 'cylinder':
        operation = 'CREATE_CYLINDER';
        const radius = parameters.radius || parameters.diameter / 2;
        description = `Create cylinder: Ø${radius * 2}mm × ${parameters.height}mm`;
        break;
      case 'sphere':
        operation = 'CREATE_SPHERE';
        const sphereRadius = parameters.radius || parameters.diameter / 2;
        description = `Create sphere: Ø${sphereRadius * 2}mm`;
        break;
      case 'cone':
        operation = 'CREATE_CONE';
        const coneRadius = parameters.radius || parameters.diameter / 2;
        description = `Create cone: Ø${coneRadius * 2}mm × ${parameters.height}mm`;
        break;
      case 'torus':
        operation = 'CREATE_TORUS';
        description = `Create torus: major=${parameters.majorRadius}mm, minor=${parameters.minorRadius}mm`;
        break;
      default:
        operation = 'CREATE_BOX';
        description = `Create default box shape`;
    }

    return {
      id: opId,
      type: 'CREATE',
      operation,
      parameters: {
        ...parameters,
        position: position || { x: 0, y: 0, z: 0 }
      },
      dependsOn: [],
      streaming: true,
      description,
      estimatedTime: 100
    };
  }

  /**
   * Creates operation for a feature (hole, fillet, etc.)
   */
  private createFeatureOperation(feature: any, baseGeometryId: string): GeometryOperation {
    const opId = this.generateOperationId();
    const { type, name, parameters, description } = feature;

    let operation: string;
    let opDescription: string;

    switch (type.toLowerCase()) {
      case 'hole':
        operation = 'ADD_HOLE';
        opDescription = description || `Add hole: Ø${parameters.diameter}mm`;
        break;
      case 'fillet':
        operation = 'ADD_FILLET';
        opDescription = description || `Add fillet: R${parameters.radius}mm`;
        break;
      case 'chamfer':
        operation = 'ADD_CHAMFER';
        opDescription = description || `Add chamfer: ${parameters.distance}mm`;
        break;
      case 'pocket':
        operation = 'ADD_POCKET';
        opDescription = description || `Add pocket: depth ${parameters.depth}mm`;
        break;
      case 'boss':
        operation = 'ADD_BOSS';
        opDescription = description || `Add boss: Ø${parameters.diameter}mm`;
        break;
      default:
        operation = 'MODIFY';
        opDescription = `Apply feature: ${type}`;
    }

    return {
      id: opId,
      type: 'FEATURE',
      operation,
      parameters: {
        ...parameters,
        name
      },
      dependsOn: [baseGeometryId],
      streaming: true,
      description: opDescription,
      estimatedTime: 150
    };
  }

  /**
   * Creates operation for manufacturability analysis
   */
  private createAnalysisOperation(
    geometryId: string,
    manufacturability: any
  ): GeometryOperation {
    const opId = this.generateOperationId();

    return {
      id: opId,
      type: 'ANALYZE',
      operation: 'ANALYZE_DFM',
      parameters: {
        processes: manufacturability.processes,
        complexity: manufacturability.complexity
      },
      dependsOn: [geometryId],
      streaming: false,
      description: 'Analyze manufacturability',
      estimatedTime: 50
    };
  }

  /**
   * Resolves operation dependencies and returns execution order
   */
  resolveDependencies(operations: GeometryOperation[]): GeometryOperation[] {
    const resolved: GeometryOperation[] = [];
    const visited = new Set<string>();

    const visit = (opId: string) => {
      if (visited.has(opId)) return;

      const op = operations.find(o => o.id === opId);
      if (!op) return;

      // Visit dependencies first
      for (const depId of op.dependsOn) {
        visit(depId);
      }

      visited.add(opId);
      resolved.push(op);
    };

    // Visit all operations
    for (const op of operations) {
      visit(op.id);
    }

    return resolved;
  }

  /**
   * Estimates total execution time for a sequence
   */
  estimateTotalTime(operations: GeometryOperation[]): number {
    return operations.reduce((sum, op) => sum + (op.estimatedTime || 0), 0);
  }

  /**
   * Generates a unique operation ID
   */
  private generateOperationId(): string {
    return `op_${++this.operationCounter}_${Date.now()}`;
  }

  /**
   * Validates operation sequence
   */
  validateSequence(operations: GeometryOperation[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const opIds = new Set(operations.map(op => op.id));

    for (const op of operations) {
      // Check for circular dependencies
      if (op.dependsOn.includes(op.id)) {
        errors.push(`Operation ${op.id} depends on itself`);
      }

      // Check if dependencies exist
      for (const depId of op.dependsOn) {
        if (!opIds.has(depId)) {
          errors.push(`Operation ${op.id} depends on non-existent operation ${depId}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Utility function to create a sequencer and build operations
 */
export function buildOperationSequence(intent: GeometryIntent): GeometryOperation[] {
  const sequencer = new OperationSequencer();
  const operations = sequencer.buildSequence(intent);
  return sequencer.resolveDependencies(operations);
}

/**
 * Creates a refinement sequence that only updates changed parameters
 */
export function buildRefinementSequence(
  originalIntent: GeometryIntent,
  refinedIntent: GeometryIntent
): GeometryOperation[] {
  const sequencer = new OperationSequencer();
  
  // For now, rebuild entire sequence
  // TODO: Implement smart diff to only update changed operations
  const operations = sequencer.buildSequence(refinedIntent);
  return sequencer.resolveDependencies(operations);
}
