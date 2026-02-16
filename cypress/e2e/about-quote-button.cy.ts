/**
 * @file E2E test for About page "Request Quote" button navigation.
 *
 * Verifies that users can navigate from the home page to the about page,
 * see the "Request Quote" button, and click it to navigate to the contact page.
 * These specs run against a real browser and the running Next.js app. Start the
 * app first (e.g. `pnpm dev`). baseUrl is set in cypress.config.ts
 * (default http://localhost:3000).
 */

describe("About page Request Quote button", () => {
  it("navigates from home to about page, renders Request Quote button, and navigates to contact page", () => {
    // Start on the home page
    cy.visit("/");

    // Navigate to the about page by clicking the About link in the header
    cy.get("nav").find("a").contains("About").click();

    // Assert we are at the /about route
    cy.location("pathname").should("eq", "/about");

    // Check if the "Request Quote" button is rendered
    cy.get("a").contains("Request a Quote").should("be.visible");

    // Click on the "Request Quote" button
    cy.get("a").contains("Request a Quote").click();

    // Assert we are at the /contact route
    cy.location("pathname").should("eq", "/contact");
  });
});
