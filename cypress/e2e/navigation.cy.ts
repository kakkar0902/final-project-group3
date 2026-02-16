/**
 * @file E2E navigation tests (header/navbar and footer links and page content).
 *
 * These specs run against a real browser and the running Next.js app. Start the
 * app first (e.g. `pnpm dev`). baseUrl is set in cypress.config.ts
 * (default http://localhost:3000).
 */

describe("Testing the Navigation", () => {
  describe("Header", () => {
    beforeEach(() => {
      cy.visit("/");
    });

    /** Asserts the home page renders with the expected main heading. */
    it("shows home heading on initial load", () => {
      cy.get("h1").should("contain", "Shoreline Woodworks");
    });

    /** Clicks the Projects link in the nav, then checks pathname and h1. */
    it("navigates to Projects when clicking the Projects link and shows Projects heading", () => {
      cy.get("nav").find("a").contains("Projects").click();

      cy.location("pathname").should("eq", "/projects");
      cy.get("h1").should("have.text", "Projects");
    });

    /** Clicks the About link in the nav, then checks pathname and h1. */
    it("navigates to About when clicking the About link and shows About heading", () => {
      cy.get("nav").find("a").contains("About").click();

      cy.location("pathname").should("eq", "/about");
      cy.get("h1").should("contain", "About");
    });

    /** Clicks the Contact link in the nav, then checks pathname and h1. */
    it("navigates to Contact when clicking the Contact link and shows Contact heading", () => {
      cy.get("nav").find("a").contains("Contact").click();

      cy.location("pathname").should("eq", "/contact");
      cy.get("h1").should("have.text", "Get In Touch");
    });
  });

  describe("Footer", () => {
    beforeEach(() => {
      cy.visit("/");
    });

    /** Asserts the footer is present and contains the logo. */
    it("renders the footer with logo", () => {
      cy.get("[data-testid=footer]").should("be.visible");
      cy.get("[data-testid=footer]").find("img[alt='Shoreline Woodworks']").should("be.visible");
    });

    /** Asserts the Navigation section has the three links with correct hrefs. */
    it("contains Navigation section with Home, Projects, and Contact links", () => {
      cy.get("[data-testid=footer]").within(() => {
        cy.get("h4").contains("Navigation").should("be.visible");
        cy.get("a").contains("Home").should("have.attr", "href", "/");
        cy.get("a").contains("Projects").should("have.attr", "href", "/projects");
        cy.get("a").contains("Contact").should("have.attr", "href", "/contact");
      });
    });

    /** Asserts the Contact section has phone and email links (scopes to visible block: desktop or mobile). */
    it("contains Contact section with phone and email links", () => {
      cy.get("[data-testid=footer-contact-desktop], [data-testid=footer-contact-mobile]")
        .filter(":visible")
        .first()
        .within(() => {
          cy.get("h4").contains("Contact").should("be.visible");
          cy.get("a[href='tel:902-412-7358']").should("be.visible").and("contain", "902-412-7358");
          cy.get("a[href='mailto:info@shorelinewoodworks.ca']")
            .should("be.visible")
            .and("contain", "info@shorelinewoodworks.ca");
        });
    });

    /** Asserts the copyright line contains the current year and business name. */
    it("displays copyright with current year and business name", () => {
      const currentYear = new Date().getFullYear();
      cy.get("[data-testid=footer-copyright]")
        .should("be.visible")
        .and("contain", currentYear)
        .and("contain", "Shoreline Woodworks")
        .and("contain", "All rights reserved");
    });

    /** Clicks Footer Home link and asserts navigation. */
    it("navigates to Home when clicking the Footer Home link", () => {
      cy.get("[data-testid=footer]").find("a").contains("Home").click();
      cy.location("pathname").should("eq", "/");
      cy.get("h1").should("contain", "Shoreline Woodworks");
    });

    /** Clicks Footer Projects link and asserts navigation. */
    it("navigates to Projects when clicking the Footer Projects link", () => {
      cy.get("[data-testid=footer]").find("a").contains("Projects").click();
      cy.location("pathname").should("eq", "/projects");
      cy.get("h1").should("have.text", "Projects");
    });

    /** Clicks Footer Contact link and asserts navigation. */
    it("navigates to Contact when clicking the Footer Contact link", () => {
      cy.get("[data-testid=footer]").find("a").contains("Contact").click();
      cy.location("pathname").should("eq", "/contact");
      cy.get("h1").should("have.text", "Get In Touch");
    });
  });
});
