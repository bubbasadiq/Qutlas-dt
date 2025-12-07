// Playwright E2E test: full user flow from upload to job routing
import { test, expect } from "@playwright/test"

test.describe("Qutlas E2E: Upload to Job Route", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/auth/login")
    await page.fill('input[type="email"]', "test@example.com")
    await page.fill('input[type="password"]', "password123")
    await page.click('button:has-text("Sign In")')
    await page.waitForURL("**/dashboard")
  })

  test("should upload CAD file, validate, configure variant, and route to hub", async ({ page }) => {
    // Step 1: Navigate to studio
    await page.click('button:has-text("New Project")')
    await page.waitForURL("**/studio")

    // Step 2: Upload STEP file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles("tests/fixtures/sample.step")

    // Step 3: Verify file loaded and validation passed
    await expect(page.locator("text=Manufacturability")).toBeVisible()
    await expect(page.locator("text=0.88")).toBeVisible() // AI score

    // Step 4: Modify parametric values
    await page.fill('input[placeholder*="Length"]', "120")
    await page.waitForTimeout(500)

    // Step 5: Generate toolpath
    await page.click('button:has-text("Generate Toolpath")')
    await page.waitForTimeout(2000)

    // Step 6: Select hub and route job
    await page.click("text=TechHub LA")
    await page.click('button:has-text("Route Job")')

    // Step 7: Complete payment
    await expect(page.locator("text=Complete Payment")).toBeVisible()
    await page.fill('input[placeholder*="Card"]', "4242424242424242")
    await page.click('button:has-text("Pay & Route Job")')

    // Step 8: Verify job confirmation
    await expect(page.locator("text=Job routed successfully")).toBeVisible({ timeout: 5000 })
  })

  test("should handle hub unavailability gracefully", async ({ page }) => {
    await page.click('button:has-text("New Project")')
    await page.waitForURL("**/studio")

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles("tests/fixtures/large-part.step")

    // Wait for validation
    await page.waitForTimeout(2000)

    // Check that fallback hubs are shown
    const hubList = page.locator('[data-testid="hub-list"]')
    await expect(hubList).toContainText("MechPrecision Toronto")
  })

  test("should reject non-manufacturable designs", async ({ page }) => {
    await page.click('button:has-text("New Project")')
    await page.waitForURL("**/studio")

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles("tests/fixtures/impossible.step")

    // Wait for AI assessment
    await page.waitForTimeout(2000)

    // Check for manufacturability warning
    const warning = page.locator("text=Wall thickness too thin")
    await expect(warning).toBeVisible()

    // Verify apply fix works
    await page.click('button:has-text("Apply Fix")')
    await page.waitForTimeout(500)

    // Check that score improved
    const score = page.locator("text=Manufacturability").locator("..").locator("text=/\\d+%/")
    const text = await score.textContent()
    expect(Number.parseInt(text || "0")).toBeGreaterThan(50)
  })
})
