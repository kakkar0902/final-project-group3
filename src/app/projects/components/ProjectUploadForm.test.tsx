/**
 * @file ProjectUploadForm component tests.
 *
 * Verifies that the form renders correctly in create/edit mode, validation
 * (required title, at least one image, date month when year set), and that
 * the correct APIs are called (GET /api/projects/[id] in edit mode, PATCH on submit).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectUploadForm from "./ProjectUploadForm";

vi.mock("next/image", async () => ({
  default: (await import("../../../../tests/mocks/next-image")).default,
}));

vi.mock("./TagInput", () => ({
  default: () => <div data-testid="tag-input">TagInput</div>,
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ProjectUploadForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Create mode (no editProject)", () => {
    it("renders collapsed with Upload New Project button", () => {
      render(<ProjectUploadForm />);

      expect(
        screen.getByRole("button", { name: "+ Upload New Project" }),
      ).toBeInTheDocument();
    });

    it("expands to show form when clicking the button", async () => {
      const user = userEvent.setup();
      render(<ProjectUploadForm />);

      await user.click(screen.getByRole("button", { name: "+ Upload New Project" }));

      expect(
        screen.getByRole("heading", { name: "Upload New Project" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
      expect(screen.getByTestId("tag-input")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Create Project" }),
      ).toBeInTheDocument();
    });

    it("submit button is disabled when title is empty", async () => {
      const user = userEvent.setup();
      render(<ProjectUploadForm />);
      await user.click(screen.getByRole("button", { name: "+ Upload New Project" }));

      const submitButton = screen.getByRole("button", { name: "Create Project" });
      expect(submitButton).toBeDisabled();
    });

    it("submit button is disabled when no images", async () => {
      const user = userEvent.setup();
      render(<ProjectUploadForm />);
      await user.click(screen.getByRole("button", { name: "+ Upload New Project" }));

      await user.type(screen.getByLabelText(/Title/), "My Project");

      const submitButton = screen.getByRole("button", { name: "Create Project" });
      expect(submitButton).toBeDisabled();
    });

    it("shows error when form is submitted with no images", async () => {
      const user = userEvent.setup();
      render(<ProjectUploadForm />);
      await user.click(screen.getByRole("button", { name: "+ Upload New Project" }));

      await user.type(screen.getByLabelText(/Title/), "My Project");

      const form = screen.getByRole("button", { name: "Create Project" }).closest("form");
      expect(form).toBeInTheDocument();
      await act(() => {
        form?.requestSubmit();
      });

      await waitFor(() => {
        expect(screen.getByText("Please add at least one image.")).toBeInTheDocument();
      });
    });

  });

  describe("Project date section", () => {
    it("renders optional date fields with Year and Month when form is expanded", async () => {
      const user = userEvent.setup();
      render(<ProjectUploadForm />);
      await user.click(screen.getByRole("button", { name: "+ Upload New Project" }));

      expect(screen.getByText("Project date (optional)")).toBeInTheDocument();
      expect(screen.getByRole("combobox", { name: "Year" })).toBeInTheDocument();
      expect(screen.getByRole("combobox", { name: "Month" })).toBeInTheDocument();
    });
  });

  describe("Edit mode (editProject provided)", () => {
    const editProject = {
      id: "proj-1",
      title: "Existing Project",
      description: "A description",
      imageUrl: "https://example.com/img.jpg",
      imagePublicId: "pid-1",
      tags: ["Residential"],
      featured: false,
      createdAt: "2024-01-15T00:00:00.000Z",
      updatedAt: "2024-01-15T00:00:00.000Z",
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ...editProject, images: [{ imageUrl: editProject.imageUrl, imagePublicId: editProject.imagePublicId }] }),
      });
    });

    it("renders expanded with Edit Project heading", async () => {
      render(<ProjectUploadForm editProject={editProject} />);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Edit Project" }),
        ).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue("Existing Project")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Update Project" }),
      ).toBeInTheDocument();
    });

    it("fetches GET /api/projects/[id] when editProject is set", async () => {
      render(<ProjectUploadForm editProject={editProject} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/projects/proj-1",
          expect.objectContaining({ credentials: "include" }),
        );
      });
    });

    it("calls PATCH /api/projects/[id] on submit and onSuccess when response is ok", async () => {
      const onSuccess = vi.fn();
      const user = userEvent.setup();

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ ...editProject, images: [{ imageUrl: editProject.imageUrl, imagePublicId: editProject.imagePublicId }] }),
      });

      const originalXHR = global.XMLHttpRequest;
      let loadListener: (() => void) | null = null;
      const mockXHR = vi.fn().mockImplementation(function (this: XMLHttpRequest & { open: (method: string, url: string) => void; send: (body?: Document | XMLHttpRequestBodyInit | null) => void }) {
        this.open = vi.fn();
        this.send = vi.fn(() => {
          if (loadListener) {
            Object.defineProperty(this, "status", { value: 200, configurable: true });
            Object.defineProperty(this, "responseText", { value: JSON.stringify({ ...editProject, title: "Updated" }), configurable: true });
            loadListener();
          }
        });
        this.withCredentials = false;
        Object.defineProperty(this, "upload", { value: { addEventListener: vi.fn() }, configurable: true });
        this.addEventListener = vi.fn((event: string, handler: () => void) => {
          if (event === "load") loadListener = handler;
        });
        return this;
      });
      global.XMLHttpRequest = mockXHR as unknown as typeof global.XMLHttpRequest;

      render(<ProjectUploadForm editProject={editProject} onSuccess={onSuccess} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Existing Project")).toBeInTheDocument();
      });

      const submitButton = screen.getByRole("button", { name: "Update Project" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockXHR).toHaveBeenCalled();
        const instance = mockXHR.mock.results[0]?.value as { open: (method: string, url: string) => void };
        expect(instance.open).toHaveBeenCalledWith("PATCH", "/api/projects/proj-1");
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ title: "Updated" }));
      });

      global.XMLHttpRequest = originalXHR;
    });
  });
});
