/**
 * @file ProjectsFilters component tests.
 *
 * Verifies that ProjectsFilters renders tag and year filters correctly, handles
 * reorder mode display, and calls callback handlers when filters are changed.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectsFilters from "./ProjectsFilters";
import { TAG_NONE } from "../constants";

describe("ProjectsFilters", () => {
  const mockTagNames = ["Residential", "Commercial", "Institutional"];
  const mockYears = [2024, 2023, 2022];
  const mockOnTagChange = vi.fn();
  const mockOnYearChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** Ensures the component renders tag filter buttons and year dropdown in normal mode. */
  it("renders tag filters and year dropdown when not in reorder mode", () => {
    render(
      <ProjectsFilters
        tagNames={mockTagNames}
        years={mockYears}
        selectedTag={null}
        selectedYear={null}
        isReorderMode={false}
        onTagChange={mockOnTagChange}
        onYearChange={mockOnYearChange}
      />,
    );
    expect(screen.getByText("Tag:")).toBeInTheDocument();
    expect(screen.getByText("Year:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "None" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Filter by year" })).toBeInTheDocument();
  });

  /** Asserts that all tag buttons (All, None, and individual tags) are rendered. */
  it("renders All, None, and individual tag buttons", () => {
    render(
      <ProjectsFilters
        tagNames={mockTagNames}
        years={mockYears}
        selectedTag={null}
        selectedYear={null}
        isReorderMode={false}
        onTagChange={mockOnTagChange}
        onYearChange={mockOnYearChange}
      />,
    );
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "None" })).toBeInTheDocument();
    mockTagNames.forEach((tag) => {
      expect(screen.getByRole("button", { name: tag })).toBeInTheDocument();
    });
  });

  /** Asserts that year dropdown contains 'All time' option and all provided years. */
  it("renders year dropdown with All time option and all years", () => {
    render(
      <ProjectsFilters
        tagNames={mockTagNames}
        years={mockYears}
        selectedTag={null}
        selectedYear={null}
        isReorderMode={false}
        onTagChange={mockOnTagChange}
        onYearChange={mockOnYearChange}
      />,
    );
    const yearSelect = screen.getByRole("combobox", { name: "Filter by year" });
    expect(yearSelect).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "All time" })).toBeInTheDocument();
    mockYears.forEach((year) => {
      expect(screen.getByRole("option", { name: String(year) })).toBeInTheDocument();
    });
  });

  /**
   * Verifies that clicking the 'All' tag button calls onTagChange with null.
   */
  it("calls onTagChange with null when All button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ProjectsFilters
        tagNames={mockTagNames}
        years={mockYears}
        selectedTag="Residential"
        selectedYear={null}
        isReorderMode={false}
        onTagChange={mockOnTagChange}
        onYearChange={mockOnYearChange}
      />,
    );
    const allButton = screen.getByRole("button", { name: "All" });
    await user.click(allButton);
    expect(mockOnTagChange).toHaveBeenCalledTimes(1);
    expect(mockOnTagChange).toHaveBeenCalledWith(null);
  });

  /**
   * Verifies that clicking the 'None' tag button calls onTagChange with TAG_NONE.
   */
  it("calls onTagChange with TAG_NONE when None button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ProjectsFilters
        tagNames={mockTagNames}
        years={mockYears}
        selectedTag={null}
        selectedYear={null}
        isReorderMode={false}
        onTagChange={mockOnTagChange}
        onYearChange={mockOnYearChange}
      />,
    );
    const noneButton = screen.getByRole("button", { name: "None" });
    await user.click(noneButton);
    expect(mockOnTagChange).toHaveBeenCalledTimes(1);
    expect(mockOnTagChange).toHaveBeenCalledWith(TAG_NONE);
  });

  /**
   * Verifies that clicking an individual tag button calls onTagChange with that tag name.
   */
  it("calls onTagChange with tag name when individual tag button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ProjectsFilters
        tagNames={mockTagNames}
        years={mockYears}
        selectedTag={null}
        selectedYear={null}
        isReorderMode={false}
        onTagChange={mockOnTagChange}
        onYearChange={mockOnYearChange}
      />,
    );
    const residentialButton = screen.getByRole("button", { name: "Residential" });
    await user.click(residentialButton);
    expect(mockOnTagChange).toHaveBeenCalledTimes(1);
    expect(mockOnTagChange).toHaveBeenCalledWith("Residential");
  });

  /**
   * Verifies that changing the year dropdown calls onYearChange with the selected year.
   */
  it("calls onYearChange with selected year when year dropdown changes", async () => {
    const user = userEvent.setup();
    render(
      <ProjectsFilters
        tagNames={mockTagNames}
        years={mockYears}
        selectedTag={null}
        selectedYear={null}
        isReorderMode={false}
        onTagChange={mockOnTagChange}
        onYearChange={mockOnYearChange}
      />,
    );
    const yearSelect = screen.getByRole("combobox", { name: "Filter by year" });
    await user.selectOptions(yearSelect, "2024");
    expect(mockOnYearChange).toHaveBeenCalledTimes(1);
    expect(mockOnYearChange).toHaveBeenCalledWith(2024);
  });

  /**
   * Verifies that selecting 'All time' in the year dropdown calls onYearChange with null.
   */
  it("calls onYearChange with null when All time is selected", async () => {
    const user = userEvent.setup();
    render(
      <ProjectsFilters
        tagNames={mockTagNames}
        years={mockYears}
        selectedTag={null}
        selectedYear={2024}
        isReorderMode={false}
        onTagChange={mockOnTagChange}
        onYearChange={mockOnYearChange}
      />,
    );
    const yearSelect = screen.getByRole("combobox", { name: "Filter by year" });
    await user.selectOptions(yearSelect, "");
    expect(mockOnYearChange).toHaveBeenCalledTimes(1);
    expect(mockOnYearChange).toHaveBeenCalledWith(null);
  });

  /**
   * Verifies that when isReorderMode is true, the component shows a reorder message
   * instead of the filter controls.
   */
  it("shows reorder mode message when isReorderMode is true", () => {
    render(
      <ProjectsFilters
        tagNames={mockTagNames}
        years={mockYears}
        selectedTag={null}
        selectedYear={null}
        isReorderMode={true}
        onTagChange={mockOnTagChange}
        onYearChange={mockOnYearChange}
      />,
    );
    expect(
      screen.getByText("Showing all projects in true order. Drag cards to reorder."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Tag:")).not.toBeInTheDocument();
    expect(screen.queryByText("Year:")).not.toBeInTheDocument();
  });

  /**
   * Verifies that when isReorderMode is true and selectedYear is set, the reorder message
   * includes the selected year.
   */
  it("shows reorder mode message with selected year when year filter is active", () => {
    render(
      <ProjectsFilters
        tagNames={mockTagNames}
        years={mockYears}
        selectedTag={null}
        selectedYear={2024}
        isReorderMode={true}
        onTagChange={mockOnTagChange}
        onYearChange={mockOnYearChange}
      />,
    );
    expect(
      screen.getByText("Showing all projects from 2024 in true order. Drag cards to reorder."),
    ).toBeInTheDocument();
  });

  /**
   * Verifies that the selected tag button has the primary styling class (bg-primary).
   * We check this by verifying the button has the expected className pattern.
   */
  it("applies primary styling to selected tag button", () => {
    render(
      <ProjectsFilters
        tagNames={mockTagNames}
        years={mockYears}
        selectedTag="Residential"
        selectedYear={null}
        isReorderMode={false}
        onTagChange={mockOnTagChange}
        onYearChange={mockOnYearChange}
      />,
    );
    const residentialButton = screen.getByRole("button", { name: "Residential" });
    expect(residentialButton).toHaveClass("bg-primary");
  });

  /**
   * Verifies that non-selected tag buttons do not have primary styling.
   */
  it("applies muted styling to non-selected tag buttons", () => {
    render(
      <ProjectsFilters
        tagNames={mockTagNames}
        years={mockYears}
        selectedTag="Residential"
        selectedYear={null}
        isReorderMode={false}
        onTagChange={mockOnTagChange}
        onYearChange={mockOnYearChange}
      />,
    );
    const commercialButton = screen.getByRole("button", { name: "Commercial" });
    expect(commercialButton).toHaveClass("bg-muted");
    expect(commercialButton).not.toHaveClass("bg-primary");
  });

  /**
   * Verifies that the year dropdown displays the selected year value.
   */
  it("displays selected year in the dropdown", () => {
    render(
      <ProjectsFilters
        tagNames={mockTagNames}
        years={mockYears}
        selectedTag={null}
        selectedYear={2023}
        isReorderMode={false}
        onTagChange={mockOnTagChange}
        onYearChange={mockOnYearChange}
      />,
    );
    const yearSelect = screen.getByRole("combobox", { name: "Filter by year" });
    expect(yearSelect).toHaveValue("2023");
  });

  /**
   * Verifies that the year dropdown displays empty string when no year is selected.
   */
  it("displays empty value in year dropdown when no year is selected", () => {
    render(
      <ProjectsFilters
        tagNames={mockTagNames}
        years={mockYears}
        selectedTag={null}
        selectedYear={null}
        isReorderMode={false}
        onTagChange={mockOnTagChange}
        onYearChange={mockOnYearChange}
      />,
    );
    const yearSelect = screen.getByRole("combobox", { name: "Filter by year" });
    expect(yearSelect).toHaveValue("");
  });
});
