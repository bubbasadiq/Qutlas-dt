# Testing Checklist - Platform Audit Implementation

## Pre-Flight Checks

### Environment Setup
- [ ] `.env.local` has all required variables
- [ ] Supabase credentials configured
- [ ] S3 storage credentials set
- [ ] App URL is correct (not Vercel preview URL)

## Feature Testing

### 1. Currency Display (No Dollar Signs)
- [ ] Navigate to pricing page
- [ ] Verify prices show as "49.00" not "$49.00"
- [ ] Navigate to studio and create object
- [ ] Switch to Toolpath tab
- [ ] Verify quote shows plain numbers without $ or ₦
- [ ] Check catalog page prices
- [ ] Verify no currency symbols anywhere in UI

**Expected**: All prices displayed as plain decimal numbers (e.g., "123.45")

### 2. Hubs Tab Removal
- [ ] Open studio workspace
- [ ] Select any object
- [ ] Open Properties Panel
- [ ] Verify only 2 tabs: "Properties" and "Toolpath"
- [ ] Verify no "Hubs" tab present

**Expected**: Only Properties and Toolpath tabs visible

### 3. Toolpath Feature - Process Selection
- [ ] Create a box in studio
- [ ] Select the box
- [ ] Switch to Toolpath tab
- [ ] Click "CNC Milling" → Verify it highlights
- [ ] Click "Laser Cutting" → Verify it highlights
- [ ] Click "3D Printing" → Verify strategy updates
- [ ] Try all 5 processes

**Expected**: Active process highlighted, strategy changes based on selection

### 4. Toolpath Feature - Strategy Display
- [ ] With box selected, choose "CNC Milling"
- [ ] Verify strategy shows "2.5D Pocket + Contour" or similar
- [ ] Create a cylinder
- [ ] Choose "CNC Turning"
- [ ] Verify strategy shows "Turning + Finish"
- [ ] Verify icon and text are displayed
- [ ] Check for any process-specific notes

**Expected**: Appropriate strategy for each process/geometry combination

### 5. Manufacturability Assessment
- [ ] Select object in studio
- [ ] Go to Toolpath tab
- [ ] Verify manufacturability score displays (0-100%)
- [ ] Check color coding (green/yellow/red)
- [ ] Verify "X of Y checks passed" shows
- [ ] If issues present, verify they have:
  - [ ] Severity icon (error/warning/info)
  - [ ] Clear message
  - [ ] Fix recommendation

**Expected**: Score calculated and displayed with appropriate color

### 6. Quote Estimation
- [ ] Select object in Toolpath tab
- [ ] Verify default quantity is 1
- [ ] Change quantity to 10 → Verify price updates
- [ ] Change quantity to 50 → Verify volume discount applies
- [ ] Verify quote breakdown shows:
  - [ ] Unit Price (plain number)
  - [ ] Subtotal (plain number)
  - [ ] Platform Fee (plain number)
  - [ ] Total (plain number, bold)
  - [ ] Lead time in days
- [ ] Switch manufacturing process → Verify prices update

**Expected**: Full quote breakdown with no $ symbols, real-time updates

### 7. WASM Geometry Creation
- [ ] Open studio
- [ ] Click "Box" tool in sidebar
- [ ] Verify box appears in canvas
- [ ] Try Cylinder, Sphere
- [ ] Verify all shapes render correctly
- [ ] Select shape and adjust parameters
- [ ] Click "Apply Changes"
- [ ] Verify shape updates

**Expected**: All basic shapes create and update properly

### 8. Material Selection
- [ ] Select object
- [ ] In Properties tab, click material preview
- [ ] Verify material library opens
- [ ] Select different material
- [ ] Verify material updates
- [ ] Switch to Toolpath tab
- [ ] Verify quote updates for new material

**Expected**: Material selection works and affects pricing

### 9. Email Verification Flow
- [ ] Sign up with new email
- [ ] Note the domain in verification email link
- [ ] Verify it points to your app domain (not Vercel)
- [ ] Click verification link
- [ ] Verify redirects to dashboard or studio

**Expected**: Email links use app domain, successful redirect after verification

### 10. Storage System (If Configured)
- [ ] Export a design
- [ ] Verify export completes
- [ ] Check browser console for S3 errors
- [ ] Try importing a file
- [ ] Verify no storage-related errors

**Expected**: No S3 configuration errors (or graceful degradation if not configured)

## UI/UX Testing

### Mobile Responsiveness
- [ ] Open on mobile device or resize browser to mobile width
- [ ] Verify Toolpath tab is readable
- [ ] Verify process selection buttons are tappable (44px+)
- [ ] Verify quote breakdown is properly formatted
- [ ] Test Properties tab on mobile
- [ ] Verify material selection works on mobile

**Expected**: All features work on mobile with appropriate sizing

### Performance
- [ ] Create multiple objects
- [ ] Switch between tabs rapidly
- [ ] Verify no lag or freezing
- [ ] Change process selection multiple times
- [ ] Verify calculations happen quickly
- [ ] Check browser console for errors

**Expected**: Smooth interactions, no performance issues

## Integration Testing

### End-to-End Workflow
1. [ ] Sign up / Log in
2. [ ] Navigate to studio
3. [ ] Create a box (50mm × 50mm × 50mm)
4. [ ] Select aluminum material
5. [ ] Switch to Toolpath tab
6. [ ] Select "CNC Milling"
7. [ ] Verify manufacturability score > 80%
8. [ ] Set quantity to 10
9. [ ] Note the quote total
10. [ ] Change to "Laser Cutting"
11. [ ] Verify price changes
12. [ ] Export design

**Expected**: Complete workflow works without errors

## Error Scenarios

### No Object Selected
- [ ] Open studio
- [ ] Don't select anything
- [ ] Switch to Toolpath tab
- [ ] Verify shows "Select an object to configure toolpath and get a quote"

**Expected**: Helpful message displayed

### Invalid Parameters
- [ ] Select box
- [ ] Set length to very small value (e.g., 1mm)
- [ ] Go to Toolpath tab
- [ ] Verify manufacturability issues detected
- [ ] Verify score reflects problems

**Expected**: Manufacturability system catches design issues

## Browser Compatibility

Test in:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Edge

**Expected**: Consistent behavior across browsers

## Console Checks

Throughout testing:
- [ ] Monitor browser console for errors
- [ ] Check for missing import warnings
- [ ] Verify no React key warnings
- [ ] Check for WASM initialization messages
- [ ] Verify no undefined function errors

**Expected**: Clean console with only expected logs

## Regression Testing

### Existing Features
- [ ] Undo/Redo still works
- [ ] Save workspace works
- [ ] Load workspace works
- [ ] Export dialog works
- [ ] Keyboard shortcuts work
- [ ] Object tree updates correctly
- [ ] Canvas camera controls work
- [ ] Collaboration (if enabled)

**Expected**: No existing features broken by changes

## Sign-Off

### Critical Issues Found
_List any blocking issues:_
- [ ] None found ✅
- [ ] Issue 1: _description_
- [ ] Issue 2: _description_

### Minor Issues Found
_List any non-blocking issues:_
- [ ] None found ✅
- [ ] Issue 1: _description_
- [ ] Issue 2: _description_

### Ready for Production?
- [ ] YES - All tests passed
- [ ] NO - Critical issues need fixing
- [ ] CONDITIONAL - Minor issues documented

---

**Tested By**: _____________  
**Date**: _____________  
**Environment**: _____________  
**Browser**: _____________  
**Notes**: _____________
