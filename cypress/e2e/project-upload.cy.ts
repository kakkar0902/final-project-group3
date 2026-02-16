/**
 * @file E2E project upload tests (unauthenticated).
 *
 * These specs run against a real browser and the running Next.js app. Start the
 * app first (e.g. `pnpm dev`). baseUrl is set in cypress.config.ts
 * (default http://localhost:3000). The unauthenticated suite requires no login
 * and asserts that the upload UI is hidden when the user is not signed in.
 */

describe("Project upload", () => {
  describe("Unauthenticated", () => {
    beforeEach(() => {
      cy.clearCookies();
      cy.visit("/");
    });

    /** Asserts the upload form is not shown on /projects when the user is not signed in. */
    it("does not show the upload form on /projects when not authenticated", () => {
      cy.visit("/projects");
      cy.location("pathname").should("eq", "/projects");
      cy.contains("button", "+ Upload New Project").should("not.exist");
    });
  });
});
