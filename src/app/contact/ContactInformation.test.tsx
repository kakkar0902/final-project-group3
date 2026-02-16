/**
 * @file ContactInformation component tests.
 *
 * Verifies that the ContactInformation component renders correctly and displays
 * the expected contact details: phone number, email address, and location.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ContactInformation from "./contactInformation";

describe("ContactInformation", () => {
  /** Ensures the component renders and contains the main heading. */
  it("renders the contact information section", () => {
    render(<ContactInformation />);
    expect(screen.getByRole("heading", { name: "Contact Information" })).toBeInTheDocument();
  });

  /**
   * Asserts that the phone number (902-412-7358) is present in the document.
   * The phone number is rendered as a link with href="tel:+19024127358".
   */
  it("displays the phone number", () => {
    render(<ContactInformation />);
    const phoneLink = screen.getByRole("link", { name: "902-412-7358" });
    expect(phoneLink).toBeInTheDocument();
    expect(phoneLink).toHaveAttribute("href", "tel:+19024127358");
  });

  /**
   * Asserts that the email address (info@shorelinewoodworks.ca) is present in the document.
   * The email is rendered as a link with href="mailto:info@shorelinewoodworks.ca".
   */
  it("displays the email address", () => {
    render(<ContactInformation />);
    const emailLink = screen.getByRole("link", { name: "info@shorelinewoodworks.ca" });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute("href", "mailto:info@shorelinewoodworks.ca");
  });

  /**
   * Asserts that the location (Halifax and Surrounding Area) is present in the document.
   * The location is rendered as a link to a Google Maps URL.
   */
  it("displays the location", () => {
    render(<ContactInformation />);
    const locationLink = screen.getByRole("link", { name: "Halifax and Surrounding Area" });
    expect(locationLink).toBeInTheDocument();
    expect(locationLink).toHaveAttribute("href", "https://maps.app.goo.gl/g9GkvP7rB1vANoXR6");
    expect(locationLink).toHaveAttribute("target", "_blank");
    expect(locationLink).toHaveAttribute("rel", "noopener noreferrer");
  });
});
