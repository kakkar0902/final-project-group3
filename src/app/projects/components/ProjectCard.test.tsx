/**
 * @file ProjectCard component tests.
 *
 * Verifies that ProjectCard renders project data correctly, handles conditional
 * rendering based on authentication state, and calls callback handlers appropriately.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectCard from "./ProjectCard";
import { mockProjects } from "../../../../tests/fixtures/projects";
import type { ProjectApiResponse } from "@/types/project";

vi.mock("next/image", async () => ({
  default: (await import("../../../../tests/mocks/next-image")).default,
}));

describe("ProjectCard", () => {
  const mockProject: ProjectApiResponse = mockProjects[0];

  /** Ensures the component renders the project title. */
  it("renders the project title", () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText(mockProject.title)).toBeInTheDocument();
  });

  /** Asserts that the project image is displayed when imageUrl is provided. */
  it("displays the project image when imageUrl is present", () => {
    render(<ProjectCard project={mockProject} />);
    const image = screen.getByAltText(mockProject.title);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", mockProject.imageUrl);
  });

  /** Asserts that 'No image' placeholder is shown when imageUrl is missing. */
  it("shows 'No image' placeholder when imageUrl is missing", () => {
    const projectWithoutImage: ProjectApiResponse = {
      ...mockProject,
      imageUrl: null,
    };
    render(<ProjectCard project={projectWithoutImage} />);
    expect(screen.getByText("No image")).toBeInTheDocument();
  });

  /** Verifies that the 'Featured' badge is displayed when project.featured is true. */
  it("displays Featured badge when project is featured", () => {
    render(<ProjectCard project={mockProject} />);
    expect(screen.getByText("Featured")).toBeInTheDocument();
  });

  /** Verifies that the 'Featured' badge is not displayed when project.featured is false. */
  it("does not display Featured badge when project is not featured", () => {
    const nonFeaturedProject: ProjectApiResponse = {
      ...mockProject,
      featured: false,
    };
    render(<ProjectCard project={nonFeaturedProject} />);
    expect(screen.queryByText("Featured")).not.toBeInTheDocument();
  });

  /** Asserts that project tags are rendered when present. */
  it("renders project tags", () => {
    render(<ProjectCard project={mockProject} />);
    mockProject.tags?.forEach((tag) => {
      expect(screen.getByText(tag)).toBeInTheDocument();
    });
  });

  /** Asserts that project description is rendered when present. */
  it("renders project description when present", () => {
    render(<ProjectCard project={mockProject} />);
    if (mockProject.description) {
      expect(screen.getByText(mockProject.description)).toBeInTheDocument();
    }
  });

  /** Verifies that description section is not rendered when description is null. */
  it("does not render description section when description is null", () => {
    const projectWithoutDescription: ProjectApiResponse = {
      ...mockProject,
      description: null,
    };
    render(<ProjectCard project={projectWithoutDescription} />);
    // Description is rendered in a paragraph, so we check that no description text appears
    const paragraphs = screen.queryAllByText(/./);
    expect(paragraphs.some((p) => p.textContent === mockProject.description)).toBe(false);
  });

  /**
   * Verifies that Edit and Delete buttons are not displayed when isAuthenticated is false.
   * The buttons should only appear when isAuthenticated is true and callbacks are provided.
   */
  it("does not show Edit and Delete buttons when not authenticated", () => {
    render(<ProjectCard project={mockProject} isAuthenticated={false} />);
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  /**
   * Verifies that Edit and Delete buttons are displayed when isAuthenticated is true
   * and callbacks are provided.
   */
  it("shows Edit and Delete buttons when authenticated and callbacks are provided", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <ProjectCard
        project={mockProject}
        isAuthenticated={true}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  /**
   * Verifies that Edit button is not shown when isAuthenticated is true but onEdit
   * callback is not provided.
   */
  it("does not show Edit button when authenticated but onEdit is not provided", () => {
    const onDelete = vi.fn();
    render(
      <ProjectCard
        project={mockProject}
        isAuthenticated={true}
        onDelete={onDelete}
      />,
    );
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  /** Asserts that clicking the Edit button calls onEdit with the project. */
  it("calls onEdit when Edit button is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <ProjectCard
        project={mockProject}
        isAuthenticated={true}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    const editButton = screen.getByRole("button", { name: "Edit" });
    await user.click(editButton);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(mockProject);
  });

  /** Asserts that clicking the Delete button calls onDelete with the project id. */
  it("calls onDelete when Delete button is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <ProjectCard
        project={mockProject}
        isAuthenticated={true}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    const deleteButton = screen.getByRole("button", { name: "Delete" });
    await user.click(deleteButton);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(mockProject.id);
  });

  /**
   * Verifies that Delete button shows 'Deleting…' text and is disabled when
   * deletingId matches the project id.
   */
  it("shows 'Deleting…' and disables Delete button when deletingId matches project id", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <ProjectCard
        project={mockProject}
        isAuthenticated={true}
        onEdit={onEdit}
        onDelete={onDelete}
        deletingId={mockProject.id}
      />,
    );
    const deleteButton = screen.getByRole("button", { name: "Deleting…" });
    expect(deleteButton).toBeDisabled();
  });

  /**
   * Verifies that Delete button shows 'Delete' text and is enabled when
   * deletingId does not match the project id.
   */
  it("shows 'Delete' and enables Delete button when deletingId does not match project id", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <ProjectCard
        project={mockProject}
        isAuthenticated={true}
        onEdit={onEdit}
        onDelete={onDelete}
        deletingId="other-id"
      />,
    );
    const deleteButton = screen.getByRole("button", { name: "Delete" });
    expect(deleteButton).not.toBeDisabled();
  });

  /**
   * Asserts that clicking the image calls onPhotoClick when provided and imageUrl exists.
   * The image is wrapped in a button with aria-label for accessibility.
   */
  it("calls onPhotoClick when image is clicked", async () => {
    const user = userEvent.setup();
    const onPhotoClick = vi.fn();
    render(<ProjectCard project={mockProject} onPhotoClick={onPhotoClick} />);
    const imageButton = screen.getByRole("button", {
      name: `View full size: ${mockProject.title}`,
    });
    await user.click(imageButton);
    expect(onPhotoClick).toHaveBeenCalledTimes(1);
    expect(onPhotoClick).toHaveBeenCalledWith(mockProject);
  });

  /**
   * Asserts that clicking the overlay (gallery button) calls onGalleryClick when provided.
   * The overlay is a button with aria-label for opening the gallery.
   */
  it("calls onGalleryClick when gallery overlay is clicked", async () => {
    const user = userEvent.setup();
    const onGalleryClick = vi.fn();
    render(<ProjectCard project={mockProject} onGalleryClick={onGalleryClick} />);
    const galleryButton = screen.getByRole("button", {
      name: `Open gallery: ${mockProject.title}`,
    });
    await user.click(galleryButton);
    expect(onGalleryClick).toHaveBeenCalledTimes(1);
    expect(onGalleryClick).toHaveBeenCalledWith(mockProject);
  });
});
