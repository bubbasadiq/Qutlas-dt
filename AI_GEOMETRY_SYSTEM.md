# AI Geometry Generation System

## Overview

Complete AI-powered CAD geometry generation system using Cadmium-Core WASM engine and Claude AI for natural language intent parsing.

## Architecture

```
User Input (Natural Language)
    ↓
AI Intent Parser (Claude Sonnet)
    ↓
Operation Sequencer
    ↓
Execution Engine
    ↓
Cadmium Worker (WASM)
    ↓
Three.js Mesh Rendering
    ↓
Workspace Integration
```

## Key Components

### 1. AI Intent Parser (`/lib/geometry/intent-parser.ts`)
- Converts natural language to structured geometry specifications
- Uses Claude Sonnet 4 for understanding user intent
- Validates and structures parameters

### 2. Operation Sequencer (`/lib/geometry/operation-sequencer.ts`)
- Converts parsed intent into executable operations
- Manages operation dependencies
- Optimizes operation order

### 3. Execution Engine (`/lib/geometry/execution-engine.ts`)
- Orchestrates worker communication
- Manages geometry cache
- Provides progress callbacks
- Handles mesh updates

### 4. Cadmium Worker (`/workers/cadmium-worker.ts`)
- Background thread geometry processing
- WASM-based computation
- Operation caching
- Export functionality

### 5. Canvas Utilities (`/lib/canvas-utils.ts`)
- Three.js mesh management
- Real-time mesh updates
- Scene synchronization

### 6. UI Components
- **AI Geometry Panel** (`/components/ai-geometry-panel.tsx`) - Main UI for generation
- **useAIGeometry Hook** (`/hooks/use-ai-geometry.ts`) - React integration

## Usage

### In Studio

1. Open `/studio`
2. Use the AI Geometry Panel in the left sidebar
3. Enter natural language description:
   ```
   Create a bearing: 40mm OD, 20mm ID, 15mm height
   ```
4. Click "Generate Geometry"
5. Watch real-time progress
6. Geometry appears in viewport

### Example Prompts

```typescript
// Simple shapes
"Create a box 100x50x25mm"
"Cylinder 50mm diameter, 100mm height"

// With features
"Mounting bracket 100x50x10mm with two 8mm holes"
"Bearing: 40mm OD, 20mm ID, 15mm height"

// Complex parts
"Drone frame with 450mm wheelbase, 4 arms"
"Cylindrical shaft 50mm long, 10mm diameter, with keyway"
```

## API Routes

### POST `/api/ai/generate`
Parses natural language intent and returns structured operations.

**Request:**
```json
{
  "intent": "Create a bearing: 40mm OD, 20mm ID, 15mm height"
}
```

**Response:**
```json
{
  "success": true,
  "intent": {
    "baseGeometry": {
      "type": "cylinder",
      "parameters": { "diameter": 40, "height": 15 }
    },
    "features": [
      {
        "type": "hole",
        "name": "bore",
        "parameters": { "diameter": 20, "depth": 15 }
      }
    ],
    "material": "steel",
    "manufacturability": {
      "processes": ["CNC_turning"],
      "complexity": "low"
    }
  },
  "operations": [
    {
      "id": "op_1_...",
      "type": "CREATE",
      "operation": "CREATE_CYLINDER",
      "parameters": { "diameter": 40, "height": 15 },
      "description": "Create cylinder: Ø40mm × 15mm"
    },
    {
      "id": "op_2_...",
      "type": "FEATURE",
      "operation": "ADD_HOLE",
      "parameters": { "diameter": 20, "depth": 15 },
      "description": "Add hole: Ø20mm"
    }
  ],
  "processingTime": 1234
}
```

## Supported Operations

### Shape Creation
- `CREATE_BOX` - width, height, depth
- `CREATE_CYLINDER` - radius/diameter, height
- `CREATE_SPHERE` - radius/diameter
- `CREATE_CONE` - radius/diameter, height
- `CREATE_TORUS` - majorRadius, minorRadius

### Features
- `ADD_HOLE` - diameter, depth, position
- `ADD_FILLET` - radius, edge
- `ADD_CHAMFER` - distance, edge

### Boolean Operations
- `BOOLEAN_UNION` - combine shapes
- `BOOLEAN_SUBTRACT` - cut away
- `BOOLEAN_INTERSECT` - keep overlap

### Export
- `EXPORT_STL` - ASCII STL format
- `EXPORT_OBJ` - Wavefront OBJ format

## Performance

- **Intent Parsing**: ~1-2 seconds (Claude API)
- **Operation Planning**: <100ms
- **Shape Creation**: <50ms per shape
- **Feature Operations**: <100ms per feature
- **Mesh Rendering**: <50ms per update
- **Total End-to-End**: ~2-5 seconds for simple parts

## Development

### Running Tests
```bash
npm run test
```

### Building WASM (Optional)
```bash
cd wasm/cadmium-core
./build.sh
```

Note: The system includes a JavaScript mock that works without Rust compilation.

### Adding New Operations

1. Add Rust implementation in `/wasm/cadmium-core/src/lib.rs`
2. Add worker handler in `/workers/cadmium-worker.ts`
3. Update operation sequencer in `/lib/geometry/operation-sequencer.ts`
4. Add to AI system prompt in `/lib/prompts/geometry-intent-parser.ts`

## Troubleshooting

### "Worker not initialized"
Wait for worker ready event (usually <200ms on startup)

### "Failed to parse intent"
- Check ANTHROPIC_API_KEY in `.env`
- Verify intent is descriptive enough
- Check Claude API rate limits

### "Mesh not appearing"
- Verify canvas scene is set: `setCanvasScene(scene)`
- Check console for Three.js errors
- Verify mesh data has vertices/indices/normals

### Export fails
- Ensure geometry is cached in worker
- Check geometry ID is correct
- Verify format is 'stl' or 'obj'

## Future Enhancements

- [ ] Full CSG boolean operations (using BVH)
- [ ] STEP/IGES file import
- [ ] Advanced features (proper fillets with edge detection)
- [ ] Real-time collaborative editing
- [ ] DFM analysis scoring
- [ ] Cost estimation
- [ ] Tool path generation
- [ ] Assembly constraints

## Migration Notes

### From OCCT
All OCCT references have been removed:
- No more `opencascade.js` dependency
- No `use-occt-worker` hook
- Build time reduced from 25s to 7s
- Bundle size reduced by 30MB

### Using the New System
Replace old OCCT code:
```typescript
// OLD
import { useOCCTWorker } from '@/hooks/use-occt-worker'
const { createBox } = useOCCTWorker()

// NEW
import { useAIGeometry } from '@/hooks/use-ai-geometry'
const { generateGeometry } = useAIGeometry()
await generateGeometry('Create a box 100x50x25mm')
```

## License

Part of the Qutlas platform. See main README for license details.
