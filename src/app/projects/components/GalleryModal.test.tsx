/**
 * @file GalleryModal component tests.
 *
 * Verifies that GalleryModal renders correctly, handles image display from different
 * sources (project.images array or project.imageUrl), and calls callback handlers
 * appropriately when images or close button are clicked.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GalleryModal from "./GalleryModal";
import { mockProjects } from "../../../../tests/fixtures/projects";
import type { ProjectApiResponse } from "@/types/project";

vi.mock("next/image", async () => ({
  default: (await import("../../../../tests/mocks/next-image")).default,
}));

describe("GalleryModal", () => {
  const mockOnClose = vi.fn();
  const mockOnOpenPhoto = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Verifies that the component returns null when the project has no images
   * (neither project.images nor project.imageUrl).
   */
  it("returns null when project has no images", () => {
    const projectWithoutImages: ProjectApiResponse = {
      ...mockProjects[0],
      imageUrl: null,
      images: [],
    };
    const { container } = render(
      <GalleryModal
        project={projectWithoutImages}
        onClose={mockOnClose}
        onOpenPhoto={mockOnOpenPhoto}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  /**
   * Verifies that the component renders a dialog with correct accessibility attributes
   * when images are present.
   */
  it("renders dialog with correct accessibility attributes", () => {
    const project = mockProjects[0];
    render(
      <GalleryModal project={project} onClose={mockOnClose} onOpenPhoto={mockOnOpenPhoto} />,
    );
    const dialog = screen.getByRole("dialog", { name: `Gallery: ${project.title}` });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  /**
   * Asserts that the project title is displayed in the modal header.
   */
  it("displays the project title", () => {
    const project = mockProjects[0];
    render(
      <GalleryModal project={project} onClose={mockOnClose} onOpenPhoto={mockOnOpenPhoto} />,
    );
    expect(screen.getByRole("heading", { name: project.title })).toBeInTheDocument();
  });

  /**
   * Verifies that the close button is rendered and has the correct aria-label.
   */
  it("renders close button", () => {
    const project = mockProjects[0];
    render(
      <GalleryModal project={project} onClose={mockOnClose} onOpenPhoto={mockOnOpenPhoto} />,
    );
    expect(screen.getByRole("button", { name: "Close gallery" })).toBeInTheDocument();
  });

  /**
   * Asserts that clicking the close button calls onClose.
   */
  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const project = mockProjects[0];
    render(
      <GalleryModal project={project} onClose={mockOnClose} onOpenPhoto={mockOnOpenPhoto} />,
    );
    const closeButton = screen.getByRole("button", { name: "Close gallery" });
    await user.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  /**
   * Verifies that when project has an images array, all images from that array
   * are rendered as clickable buttons.
   */
  it("renders images from project.images array", () => {
    const projectWithImages: ProjectApiResponse = {
      ...mockProjects[0],
      images: [
        { imageUrl: "https://example.com/image1.jpg" },
        { imageUrl: "https://example.com/image2.jpg" },
        { imageUrl: "https://example.com/image3.jpg" },
      ],
    };
    render(
      <GalleryModal
        project={projectWithImages}
        onClose={mockOnClose}
        onOpenPhoto={mockOnOpenPhoto}
      />,
    );
    expect(screen.getByRole("button", { name: "View image 1 of 3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View image 2 of 3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View image 3 of 3" })).toBeInTheDocument();
  });

  /**
   * Verifies that when project has no images array but has imageUrl, that single
   * image is rendered.
   */
  it("renders image from project.imageUrl when images array is not present", () => {
    const project = mockProjects[0];
    render(
      <GalleryModal project={project} onClose={mockOnClose} onOpenPhoto={mockOnOpenPhoto} />,
    );
    expect(screen.getByRole("button", { name: "View image 1 of 1" })).toBeInTheDocument();
    const image = screen.getByAltText(`${project.title} — image 1`);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", project.imageUrl);
  });

  /**
   * Asserts that clicking an image button calls onOpenPhoto with the correct index.
   */
  it("calls onOpenPhoto with correct index when image is clicked", async () => {
    const user = userEvent.setup();
    const projectWithImages: ProjectApiResponse = {
      ...mockProjects[0],
      images: [
        { imageUrl: "https://example.com/image1.jpg" },
        { imageUrl: "https://example.com/image2.jpg" },
      ],
    };
    render(
      <GalleryModal
        project={projectWithImages}
        onClose={mockOnClose}
        onOpenPhoto={mockOnOpenPhoto}
      />,
    );
    const firstImageButton = screen.getByRole("button", { name: "View image 1 of 2" });
    await user.click(firstImageButton);
    expect(mockOnOpenPhoto).toHaveBeenCalledTimes(1);
    expect(mockOnOpenPhoto).toHaveBeenCalledWith(0);

    vi.clearAllMocks();

    const secondImageButton = screen.getByRole("button", { name: "View image 2 of 2" });
    await user.click(secondImageButton);
    expect(mockOnOpenPhoto).toHaveBeenCalledTimes(1);
    expect(mockOnOpenPhoto).toHaveBeenCalledWith(1);
  });

  /**
   * Verifies that images have correct alt text with project title and image number.
   */
  it("renders images with correct alt text", () => {
    const projectWithImages: ProjectApiResponse = {
      ...mockProjects[0],
      images: [
        { imageUrl: "https://example.com/image1.jpg" },
        { imageUrl: "https://example.com/image2.jpg" },
      ],
    };
    render(
      <GalleryModal
        project={projectWithImages}
        onClose={mockOnClose}
        onOpenPhoto={mockOnOpenPhoto}
      />,
    );
    expect(
      screen.getByAltText(`${projectWithImages.title} — image 1`),
    ).toBeInTheDocument();
    expect(
      screen.getByAltText(`${projectWithImages.title} — image 2`),
    ).toBeInTheDocument();
  });

  /**
   * Verifies that clicking on the dialog backdrop (outside the content area)
   * calls onClose. The dialog itself has onClick={onClose}, but the content
   * area stops propagation.
   */
  it("calls onClose when clicking dialog backdrop", async () => {
    const user = userEvent.setup();
    const project = mockProjects[0];
    render(
      <GalleryModal project={project} onClose={mockOnClose} onOpenPhoto={mockOnOpenPhoto} />,
    );
    const dialog = screen.getByRole("dialog", { name: `Gallery: ${project.title}` });
    // Click on the dialog itself (backdrop), not on the content area
    await user.click(dialog);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  /**
   * Verifies that clicking on the content area (image grid) does not call onClose
   * because the content div stops event propagation.
   */
  it("does not call onClose when clicking image content area", async () => {
    const user = userEvent.setup();
    const project = mockProjects[0];
    render(
      <GalleryModal project={project} onClose={mockOnClose} onOpenPhoto={mockOnOpenPhoto} />,
    );
    const imageButton = screen.getByRole("button", { name: "View image 1 of 1" });
    await user.click(imageButton);
    // onClose should not be called because the content area stops propagation
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
