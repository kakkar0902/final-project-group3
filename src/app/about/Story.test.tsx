/**
 * @file Story component tests.
 *
 * Verifies that the Story component renders correctly and displays
 * the expected content: heading and paragraph text.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Story from "./story";

describe("Story", () => {
  it("renders the Our Story heading", () => {
    render(<Story />);
    expect(screen.getByRole("heading", { name: "Our Story" })).toBeInTheDocument();
  });

  it("displays the first paragraph about Shoreline Woodworks", () => {
    render(<Story />);
    expect(
      screen.getByText(
        /Shoreline Woodworks is a family-run woodworking studio based in Halifax, Nova Scotia/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /For over a decade, we have specialized in custom woodworking, architectural millwork/,
      ),
    ).toBeInTheDocument();
  });

  it("displays the second paragraph about client relationships", () => {
    render(<Story />);
    expect(
      screen.getByText(
        /We believe in building lasting relationships with our clients through honest communication/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Whether you need a complete renovation, a custom staircase, or restoration work/,
      ),
    ).toBeInTheDocument();
  });
});
