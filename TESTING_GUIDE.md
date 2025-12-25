# Production Hardening - Testing Guide

## Quick Verification Checklist

### 1. Desktop Selection Highlighting ✓

**Expected Behavior**: When you click an object in the 3D canvas on desktop, it should show a clear blue edge outline and slightly glow.

**Test Steps**:
```
1. Open /studio
2. Click "Create" → "Box" to create a box geometry
3. Click on the box in the 3D canvas
4. VERIFY: Blue edge outline appears around the box
5. VERIFY: Box has a slight blue glow (emissive)
6. Click on empty canvas area
7. VERIFY: Edge outline disappears
8. VERIFY: Glow disappears
```

**Mobile Test**:
```
1. Open /studio on mobile device or resize browser to mobile width
2. Create a box geometry
3. Tap on the box
4. VERIFY: Same blue edge outline appears
5. VERIFY: Behavior identical to desktop
```

**Code Changed**:
- File: `/app/studio/components/canvas-viewer.tsx`
- Lines: 355-395
- Key: Added `EdgesGeometry` wireframe + emissive color update on selection

---

### 2. Currency (NGN) Display ✓

**Expected Behavior**: All prices throughout the application should display in Nigerian Naira (₦) format, with no dollar signs ($) visible.

**Test Steps**:

**Pricing Page**:
```
1. Navigate to /pricing
2. VERIFY: All plans show prices as "Free" or "₦ X,XXX.XX"
3. VERIFY: No $ symbols anywhere
```

**Studio Quote Panel**:
```
1. Open /studio
2. Create a box geometry
3. Select the box
4. Right panel shows quote
5. VERIFY: "Estimated Total" shows "₦ X,XXX.XX"
6. VERIFY: Unit price shows "₦ X,XXX.XX"
7. Click "Cost Breakdown"
8. VERIFY: All line items show ₦ symbol
```

**Catalog**:
```
1. Navigate to /catalog
2. VERIFY: All part prices show "₦ X,XXX.XX"
3. Click on a part
4. VERIFY: Detail page shows ₦ prices
```

**Payment Flow**:
```
1. In studio, create object and get quote
2. Click "Submit for Manufacturing"
3. VERIFY: Checkout modal shows "Total: ₦ X,XXX.XX"
4. Continue to payment
5. VERIFY: Payment modal shows "Total: ₦X,XXX"
```

**Code Changed**:
- File: `/app/studio/components/toolbar.tsx` (line 261)
  - Changed icon from 'dollar-sign' to 'banknote'
- File: `/components/toolbar-menu.tsx` (line 33)
  - Changed icon mapping from DollarSign to Banknote

**No Changes Needed** (already correct):
- All formatPriceNGN() functions
- Currency context (NGN-only)
- Payment APIs (NGN currency)

---

### 3. Workspace Save ✓

**Expected Behavior**: Users can save workspaces with custom names, and they persist across sessions. Loading should restore all objects.

**Test Steps**:

**Save Workspace**:
```
1. Open /studio
2. Create multiple objects (box, cylinder, sphere)
3. Click "File" → "Save" (or Ctrl+S)
4. Enter workspace name: "Test Workspace 1"
5. Click Save
6. VERIFY: Toast notification "Workspace saved successfully"
7. VERIFY: No errors in console
```

**Load Workspace**:
```
1. Click "File" → "Open" (or Ctrl+O)
2. VERIFY: "Test Workspace 1" appears in list
3. Click on "Test Workspace 1"
4. VERIFY: All objects restored to canvas
5. VERIFY: No errors in console
```

**Persistence Test**:
```
1. Save workspace with name "Persist Test"
2. Close browser tab completely
3. Open new tab, navigate to /studio
4. Click "File" → "Open"
5. VERIFY: "Persist Test" still appears in list
6. Load it
7. VERIFY: Objects restored correctly
```

**Code Verified** (no changes needed):
- API: `/app/api/workspace/save/route.ts`
  - Has retry logic (2 retries, exponential backoff)
  - Stores to S3: `workspaces/{userId}/{workspaceId}.json`
- API: `/app/api/workspace/load/[id]/route.ts`
  - Loads from S3 with auth

---

### 4. Complete Checkout Flow ✓

**Expected Behavior**: Users can submit designs for manufacturing, complete payment via Flutterwave (NGN), and track job status.

**Test Steps**:

**Job Submission**:
```
1. Open /studio
2. Create a box geometry (dimensions: 100x100x100)
3. Select the box
4. Right panel shows quote with manufacturability score
5. VERIFY: "Submit for Manufacturing" button visible
6. If manufacturability < 50, button should be disabled
7. Click "Submit for Manufacturing"
8. VERIFY: Checkout modal opens
9. VERIFY: Shows process, material, lead time, manufacturability
10. VERIFY: Total price in ₦ NGN format
11. Click "Continue to Payment"
12. VERIFY: Job created, payment modal opens
```

**Payment Flow**:
```
1. Payment modal shows form
2. Enter email: test@example.com
3. Enter name: Test User
4. Enter phone: +234 800 000 0000
5. VERIFY: Total shows "₦X,XXX"
6. Click "Pay & Route Job"
7. VERIFY: Flutterwave checkout modal opens
8. VERIFY: Currency shown is NGN
9. Complete test payment (use test card if in test mode)
10. VERIFY: Payment successful
11. VERIFY: Redirected to job tracking page
```

**Job Tracking**:
```
1. After payment, on job tracking page
2. VERIFY: Job ID displayed
3. VERIFY: Status shows "paid"
4. VERIFY: Total shows "₦ X,XXX.XX"
5. VERIFY: Payment status shows correct info
6. VERIFY: Timeline shows "Payment confirmed"
7. Wait 5 seconds
8. VERIFY: Page auto-refreshes (polls every 5 seconds)
```

**API Flow Verification**:
```
API Calls Made (in order):
1. POST /api/jobs/submit
   - Creates job with status "submitted"
   - Returns jobId

2. POST /api/payment/create
   - Initializes Flutterwave payment
   - Currency: NGN
   - Returns tx_ref and payment link

3. (User completes payment in Flutterwave modal)

4. POST /api/payment/verify
   - Verifies payment with Flutterwave
   - Updates job status to "paid"
   - Returns success

5. GET /api/jobs/{jobId}
   - Loads job details
   - Shows on tracking page
```

**Code Verified** (no changes needed):
- Quote Panel: `/app/studio/components/quote-panel.tsx`
- Checkout Modal: `/app/studio/components/checkout-modal.tsx`
- Payment Modal: `/app/studio/components/payment-modal.tsx`
- Job Submit API: `/app/api/jobs/submit/route.ts`
- Payment Create API: `/app/api/payment/create/route.ts`
- Payment Verify API: `/app/api/payment/verify/route.ts`
- Job GET API: `/app/api/jobs/[jobId]/route.ts`
- Job Tracking Page: `/app/(app)/jobs/[jobId]/page.tsx`

---

## Automated Testing Commands

### Type Check
```bash
cd /home/engine/project
npx tsc --noEmit
```
*Note: Some pre-existing type errors may appear, but our changes should not introduce new ones.*

### Build Test
```bash
cd /home/engine/project
npm install --legacy-peer-deps
npx next build
```

### Lint Check
```bash
cd /home/engine/project
npm run lint
```

---

## Known Issues (Pre-existing)

These issues existed before our changes and are not introduced by this PR:

1. **TypeScript Errors**: Some type mismatches in hooks (use-stats, use-projects)
2. **Next.js Version**: Using 16.0.7 which has known security vulnerabilities
3. **Peer Dependencies**: Requires `--legacy-peer-deps` for installation
4. **AI SDK Types**: Some type incompatibilities with @ai-sdk/react

These do not affect the functionality of our fixes.

---

## Environment Requirements

### Required Environment Variables
Ensure these are set in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Supabase S3 Storage
SUPABASE_S3_ENDPOINT=
SUPABASE_S3_REGION=
SUPABASE_S3_ACCESS_KEY_ID=
SUPABASE_S3_SECRET_ACCESS_KEY=

# Flutterwave (NGN payments)
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=
FLUTTERWAVE_SECRET_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Success Criteria

All of these must pass:

- [ ] Desktop object selection shows blue edge outline
- [ ] Mobile object selection shows blue edge outline
- [ ] All prices display with ₦ symbol (no $)
- [ ] Workspace save works without errors
- [ ] Workspace load restores all objects
- [ ] Quote panel "Submit for Manufacturing" button works
- [ ] Checkout modal displays order summary in NGN
- [ ] Payment modal collects user info
- [ ] Flutterwave payment opens with NGN currency
- [ ] Payment completion updates job status to "paid"
- [ ] Job tracking page displays correctly
- [ ] No console errors during full flow
- [ ] All pages load without crashing

---

## Rollback Plan

If issues are discovered:

1. Revert canvas-viewer.tsx changes (selection highlighting)
2. Revert toolbar icon changes (banknote → dollar-sign)
3. The workspace save and checkout flow already existed and work correctly

**Git Commands**:
```bash
# To revert specific file
git checkout HEAD~1 -- app/studio/components/canvas-viewer.tsx

# Or to revert entire commit
git revert <commit-hash>
```

---

## Contact

For questions or issues with these changes, refer to:
- Implementation document: `PRODUCTION_HARDENING_COMPLETE.md`
- Original ticket: Production Hardening Task
- Branch: `prod-harden-desktop-selection-save-ngn-checkout`

---

**Last Updated**: December 25, 2024  
**Tested By**: [Your Name]  
**Status**: Ready for QA
