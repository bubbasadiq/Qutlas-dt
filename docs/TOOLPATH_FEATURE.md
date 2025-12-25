# Toolpath Feature Documentation

## Overview

The Toolpath feature provides a comprehensive manufacturing workflow that connects geometry design with real-world production capabilities. It's integrated into the Properties Panel as a dedicated tab.

## Location

**File**: `/app/studio/components/properties-panel.tsx`  
**Tab**: "Toolpath" (second tab in Properties Panel)

## Architecture

### Dependencies

```typescript
import { selectToolpath } from "@/lib/toolpath/select-toolpath"
import { assessManufacturability } from "@/lib/manufacturability/assess"
import { estimateQuote } from "@/lib/quote/estimate"
```

### Component Flow

```
User Selects Object
    ↓
Choose Manufacturing Process
    ↓
System Calculates Toolpath Strategy
    ↓
Manufacturability Assessment
    ↓
Quote Estimation
```

## Features

### 1. Manufacturing Process Selection

**Available Processes**:
- CNC Milling - Multi-axis machining for complex parts
- CNC Turning - For axisymmetric/cylindrical parts
- Laser Cutting - 2D profiles from sheet stock
- 3D Printing - Additive manufacturing for complex geometry
- Sheet Metal - Cut and bend operations

**UI**: Interactive grid with visual selection states

### 2. Toolpath Strategy

**Logic** (`selectToolpath()`):
- Analyzes object type (box, cylinder, sphere, cone, torus)
- Considers material properties
- Evaluates geometry complexity
- Determines optimal machining strategy

**Examples**:
- **CNC Milling** → "2.5D Pocket + Contour" or "3D Adaptive + Finishing"
- **CNC Turning** → "Rough turning + finish turning + part-off"
- **Laser Cutting** → "Lead-in + Contour (1 pass) + Lead-out"
- **3D Printing** → "Auto-orient + Slice (infill + perimeters)"
- **Sheet Metal** → "Laser cut flat pattern + press brake bends"

### 3. Manufacturability Assessment

**Checks** (`assessManufacturability()`):
- Wall thickness validation
- Hole diameter requirements
- Aspect ratio warnings
- Hole-to-edge distance
- Process-specific constraints

**Score Calculation**:
- 0-100% scale
- Color-coded: Green (≥80%), Yellow (≥60%), Red (<60%)
- Shows passed/failed check counts

**Issue Severity Levels**:
- **Error**: Blocks manufacturing (e.g., wall too thin)
- **Warning**: May cause issues (e.g., small holes)
- **Info**: Optimization suggestions (e.g., high aspect ratio)

### 4. Quote Estimation

**Inputs**:
- Quantity
- Material (from object)
- Manufacturing process
- Geometry parameters
- Feature complexity

**Calculation** (`estimateQuote()`):
```javascript
unitPrice = (base + volumeCost + complexityCost) 
          × materialMultiplier 
          × processMultiplier 
          × toolpathMultiplier
```

**Multipliers**:
- **Material**: Titanium 2.2×, Stainless 1.6×, Steel 1.3×, Aluminum 1.0×
- **Process**: Laser 0.8×, 3D Print 0.9×, CNC 1.1×
- **Toolpath**: 3D adaptive 1.25×, Turning 1.15×, Laser 0.85×

**Volume Discounts**:
- 10+ parts: 5% discount
- 50+ parts: 10% discount
- 100+ parts: 15% discount

**Output**:
- Unit Price
- Subtotal
- Platform Fee (15%)
- Total Price
- Lead Time (days)

## User Flow

### Step 1: Select Object
User must select an object in the canvas before accessing toolpath features.

### Step 2: Choose Process
Click one of the 5 manufacturing process buttons.

### Step 3: Review Strategy
System automatically displays the optimal toolpath strategy based on:
- Selected process
- Object geometry
- Material properties

### Step 4: Check Manufacturability
Review the manufacturability score and any issues/warnings.

### Step 5: Get Quote
Adjust quantity if needed and review the pricing breakdown.

### Step 6: Proceed
Use the quote information to decide whether to:
- Adjust design parameters
- Change material
- Try different manufacturing process
- Proceed with order

## API Reference

### `selectToolpath(params)`

Determines optimal toolpath strategy.

**Parameters**:
```typescript
{
  process?: string        // Manufacturing process name
  material?: string       // Material name
  objectType?: string     // Geometry type (box, cylinder, etc.)
  geometryParams?: Record<string, any>
  featureCount?: number   // Number of features (holes, fillets, etc.)
}
```

**Returns**:
```typescript
{
  id: string              // Unique toolpath ID
  name: string            // Display name
  strategy: string        // Detailed strategy description
  notes?: string          // Additional notes/warnings
}
```

### `assessManufacturability(params)`

Validates design against manufacturing constraints.

**Parameters**:
```typescript
{
  parameters: Record<string, any>  // Geometry parameters
  process?: string                  // Manufacturing process
}
```

**Returns**:
```typescript
{
  score: number                     // 0-100
  issues: Array<{
    id: string
    severity: 'error' | 'warning' | 'info'
    message: string
    fix: string
  }>
  passedChecks: number
  totalChecks: number
}
```

### `estimateQuote(input)`

Calculates pricing for manufacturing.

**Parameters**:
```typescript
{
  quantity: number
  material?: string
  process?: string
  toolpathId?: string
  geometryParams?: Record<string, any>
  featureCount?: number
}
```

**Returns**:
```typescript
{
  unitPrice: number
  subtotal: number
  platformFee: number
  totalPrice: number
  leadTimeDays: number
}
```

## Mobile Responsiveness

All UI components are mobile-optimized using the `isMobile` hook:
- Larger touch targets on mobile (44px minimum)
- Adjusted spacing and typography
- Responsive grid layouts
- Touch-friendly controls

## Styling

Uses Tailwind CSS with design system variables:
- `var(--primary-700)` - Primary actions
- `var(--neutral-500)` - Secondary text
- `var(--accent-500)` - Highlights
- Green/Yellow/Red - Score indicators

## Future Enhancements

Potential additions:
- [ ] Export toolpath to CAM software
- [ ] 3D visualization of toolpath
- [ ] Multiple material options per object
- [ ] Advanced feature detection
- [ ] Custom tooling selection
- [ ] Lead time breakdown
- [ ] Batch quote comparison

## Testing

Test scenarios:
1. Select different object types → Verify appropriate toolpath strategies
2. Change manufacturing process → Verify strategy updates
3. Adjust quantity → Verify volume discounts apply
4. Change material → Verify multipliers update
5. Create complex geometry → Verify manufacturability issues detected

## Support

For issues or questions about the Toolpath feature:
- Check manufacturability score for design validation
- Review issue fixes for guidance
- Try different manufacturing processes
- Adjust geometry parameters
- Contact support if needed
