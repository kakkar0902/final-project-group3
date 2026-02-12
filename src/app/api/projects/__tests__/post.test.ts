/**
 * Tests for the `POST /api/projects` route handler.
 *
 * These integration-style tests focus on request validation, interaction with
 * Prisma, and Cloudinary upload/cleanup behavior. We mock external services
 * (auth, database, and Cloudinary) so that the tests can run deterministically
 * without real network calls or a real database.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { uploadImage, deleteImage } from "@/lib/cloudinary";
import type { ProjectApiResponse } from "@/types/project";

// Mock auth guard used by the POST handler so we can simulate different
// authorization outcomes (admin, non-admin, unauthenticated) in isolation.
vi.mock("@/lib/auth-guards", () => ({
  requireAdmin: vi.fn(),
}));

// Mock the Prisma client so that route tests never depend on a live database.
vi.mock("@/lib/db", () => ({
  prisma: {
    project: {
      create: vi.fn(),
    },
  },
}));

// Mock Cloudinary helpers so tests avoid real image uploads/deletions and only
// assert that the route calls them with the correct arguments.
vi.mock("@/lib/cloudinary", () => ({
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}));

describe("POST /api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successfully creates a new project with a valid payload and no image", async () => {
    (requireAdmin as unknown as any).mockResolvedValue({
      ok: true,
      session: {},
      response: null,
    });

    const createdProject: ProjectApiResponse = {
      id: "proj_1",
      title: "New Project",
      description: "A brand new project",
      category: "Residential",
      featured: true,
      imageUrl: null,
      imagePublicId: null,
      createdAt: "2026-02-12T10:00:00.000Z",
      updatedAt: "2026-02-12T10:00:00.000Z",
    };

    (prisma.project.create as unknown as any).mockResolvedValue(createdProject);

    const formData = new FormData();
    // Intentionally include surrounding whitespace to verify trimming
    formData.set("title", "   New Project   ");
    formData.set("description", "A brand new project");
    formData.set("category", "Residential");
    formData.set("featured", "true");

    const req = new Request("http://localhost/api/projects", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);

    expect(requireAdmin).toHaveBeenCalledWith(req);

    expect(prisma.project.create).toHaveBeenCalledWith({
      data: {
        title: "New Project",
        description: "A brand new project",
        category: "Residential",
        featured: true,
        imageUrl: null,
        imagePublicId: null,
      },
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual(createdProject);
  });

  it("successfully creates a new project with a valid jpeg image", async () => {
    (requireAdmin as unknown as any).mockResolvedValue({
      ok: true,
      session: {},
      response: null,
    });

    const uploaded = {
      publicId: "projects/img-123",
      secureUrl: "https://res.cloudinary.com/demo/image/upload/v1/projects/img-123.jpg",
      width: 1024,
      height: 768,
      format: "jpg",
    };

    (uploadImage as unknown as any).mockResolvedValue(uploaded);

    const createdProject: ProjectApiResponse = {
      id: "proj_img_1",
      title: "Image Project",
      description: "Project with a valid jpeg image",
      category: "Residential",
      featured: true,
      imageUrl: uploaded.secureUrl,
      imagePublicId: uploaded.publicId,
      createdAt: "2026-02-12T12:00:00.000Z",
      updatedAt: "2026-02-12T12:00:00.000Z",
    };

    (prisma.project.create as unknown as any).mockResolvedValue(createdProject);

    class JpegFakeFile {
      size: number;
      type: string;
      constructor(size: number, type: string) {
        this.size = size;
        this.type = type;
      }
      async arrayBuffer(): Promise<ArrayBuffer> {
        return new ArrayBuffer(0);
      }
    }

    const jpegFile = new JpegFakeFile(1024, "image/jpeg");

    const originalFile = (globalThis as any).File;
    (globalThis as any).File = JpegFakeFile as any;

    const fakeFormData = {
      get(key: string) {
        switch (key) {
          case "title":
            return "Image Project";
          case "description":
            return "Project with a valid jpeg image";
          case "category":
            return "Residential";
          case "featured":
            return "true";
          case "image":
            return jpegFile;
          default:
            return null;
        }
      },
    };

    const req = {
      formData: async () => fakeFormData,
    } as unknown as Request;

    const res = await POST(req);

    (globalThis as any).File = originalFile;

    expect(requireAdmin).toHaveBeenCalledWith(req as unknown as Request);
    expect(uploadImage).toHaveBeenCalledTimes(1);
    expect(prisma.project.create).toHaveBeenCalledWith({
      data: {
        title: "Image Project",
        description: "Project with a valid jpeg image",
        category: "Residential",
        featured: true,
        imageUrl: uploaded.secureUrl,
        imagePublicId: uploaded.publicId,
      },
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual(createdProject);
  });

  it("successfully creates a new project when only title is provided", async () => {
    (requireAdmin as unknown as any).mockResolvedValue({
      ok: true,
      session: {},
      response: null,
    });

    const createdProject: ProjectApiResponse = {
      id: "proj_2",
      title: "Title Only Project",
      description: null,
      category: null,
      featured: false,
      imageUrl: null,
      imagePublicId: null,
      createdAt: "2026-02-12T11:00:00.000Z",
      updatedAt: "2026-02-12T11:00:00.000Z",
    };

    (prisma.project.create as unknown as any).mockResolvedValue(createdProject);

    const formData = new FormData();
    formData.set("title", "Title Only Project");

    const req = new Request("http://localhost/api/projects", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);

    expect(requireAdmin).toHaveBeenCalledWith(req);

    expect(prisma.project.create).toHaveBeenCalledWith({
      data: {
        title: "Title Only Project",
        description: null,
        category: null,
        featured: false,
        imageUrl: null,
        imagePublicId: null,
      },
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual(createdProject);
    expect("imageUrl" in body).toBe(true);
    expect("imagePublicId" in body).toBe(true);
  });

  it("returns 400 when title is missing", async () => {
    (requireAdmin as unknown as any).mockResolvedValue({
      ok: true,
      session: {},
      response: null,
    });

    const formData = new FormData();
    // Intentionally do NOT set "title"
    formData.set("description", "Missing title");

    const req = new Request("http://localhost/api/projects", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);

    expect(requireAdmin).toHaveBeenCalledWith(req);
    expect(prisma.project.create).not.toHaveBeenCalled();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Title is required" });
  });

  it("returns 400 when title is only whitespace", async () => {
    (requireAdmin as unknown as any).mockResolvedValue({
      ok: true,
      session: {},
      response: null,
    });

    const formData = new FormData();
    formData.set("title", "   "); // whitespace only
    formData.set("description", "Whitespace title");

    const req = new Request("http://localhost/api/projects", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);

    expect(requireAdmin).toHaveBeenCalledWith(req);
    expect(prisma.project.create).not.toHaveBeenCalled();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Title is required" });
  });

  it("returns 401 when the session is missing or invalid", async () => {
    (requireAdmin as unknown as any).mockResolvedValue({
      ok: false,
      session: null,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    });

    const formData = new FormData();
    formData.set("title", "Some Project");

    const req = new Request("http://localhost/api/projects", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);

    expect(requireAdmin).toHaveBeenCalledWith(req);
    expect(prisma.project.create).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 403 when the user is authenticated but not an admin", async () => {
    (requireAdmin as unknown as any).mockResolvedValue({
      ok: false,
      session: {},
      response: new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    });

    const formData = new FormData();
    formData.set("title", "Some Project");

    const req = new Request("http://localhost/api/projects", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);

    expect(requireAdmin).toHaveBeenCalledWith(req);
    expect(prisma.project.create).not.toHaveBeenCalled();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({ error: "Forbidden" });
  });

  it("returns 400 when image has an invalid svg mime type", async () => {
    (requireAdmin as unknown as any).mockResolvedValue({
      ok: true,
      session: {},
      response: null,
    });

    class FakeFile {
      size: number;
      type: string;
      constructor(size: number, type: string) {
        this.size = size;
        this.type = type;
      }
      async arrayBuffer(): Promise<ArrayBuffer> {
        return new ArrayBuffer(0);
      }
    }

    const svgFile = new FakeFile(10, "image/svg+xml");

    const originalFile = (globalThis as any).File;
    (globalThis as any).File = FakeFile as any;

    const fakeFormData = {
      get(key: string) {
        switch (key) {
          case "title":
            return "Project With SVG Image";
          case "description":
            return "Has an invalid SVG image";
          case "category":
            return "Residential";
          case "featured":
            return "true";
          case "image":
            return svgFile;
          default:
            return null;
        }
      },
    };

    const req = {
      formData: async () => fakeFormData,
    } as unknown as Request;

    const res = await POST(req);

    // Restore original File constructor after the handler runs.
    (globalThis as any).File = originalFile;

    expect(requireAdmin).toHaveBeenCalledWith(req as unknown as Request);
    expect(prisma.project.create).not.toHaveBeenCalled();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({
      error:
        "Invalid image type. Allowed: image/jpeg, image/jpg, image/png, image/webp, image/gif",
    });
  });

  it("returns 400 when image file is larger than 10MB", async () => {
    (requireAdmin as unknown as any).mockResolvedValue({
      ok: true,
      session: {},
      response: null,
    });

    class LargeFakeFile {
      size: number;
      type: string;
      constructor(size: number, type: string) {
        this.size = size;
        this.type = type;
      }
      async arrayBuffer(): Promise<ArrayBuffer> {
        return new ArrayBuffer(0);
      }
    }

    const largeFile = new LargeFakeFile(10 * 1024 * 1024 + 1, "image/jpeg");

    const originalFile = (globalThis as any).File;
    (globalThis as any).File = LargeFakeFile as any;

    const fakeFormData = {
      get(key: string) {
        switch (key) {
          case "title":
            return "Project With Large Image";
          case "description":
            return "Has an oversized image";
          case "category":
            return "Residential";
          case "featured":
            return "true";
          case "image":
            return largeFile;
          default:
            return null;
        }
      },
    };

    const req = {
      formData: async () => fakeFormData,
    } as unknown as Request;

    const res = await POST(req);

    (globalThis as any).File = originalFile;

    expect(requireAdmin).toHaveBeenCalledWith(req as unknown as Request);
    expect(prisma.project.create).not.toHaveBeenCalled();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({
      error: "Image file is too large (max 10MB)",
    });
  });

  it("returns 500 when Cloudinary upload fails", async () => {
    (requireAdmin as unknown as any).mockResolvedValue({
      ok: true,
      session: {},
      response: null,
    });

    (uploadImage as unknown as any).mockRejectedValue(
      new Error("Cloudinary upload failed"),
    );

    class FailingUploadFile {
      size: number;
      type: string;
      constructor(size: number, type: string) {
        this.size = size;
        this.type = type;
      }
      async arrayBuffer(): Promise<ArrayBuffer> {
        return new ArrayBuffer(0);
      }
    }

    const jpegFile = new FailingUploadFile(1024, "image/jpeg");

    const originalFile = (globalThis as any).File;
    (globalThis as any).File = FailingUploadFile as any;

    const fakeFormData = {
      get(key: string) {
        switch (key) {
          case "title":
            return "Project With Failing Upload";
          case "description":
            return "Cloudinary should fail during upload";
          case "category":
            return "Residential";
          case "featured":
            return "true";
          case "image":
            return jpegFile;
          default:
            return null;
        }
      },
    };

    const req = {
      formData: async () => fakeFormData,
    } as unknown as Request;

    const res = await POST(req);

    (globalThis as any).File = originalFile;

    expect(requireAdmin).toHaveBeenCalledWith(req as unknown as Request);
    expect(prisma.project.create).not.toHaveBeenCalled();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "Failed to create project" });
  });

  it("returns 500 and cleans up uploaded image when database create fails", async () => {
    (requireAdmin as unknown as any).mockResolvedValue({
      ok: true,
      session: {},
      response: null,
    });

    const uploaded = {
      publicId: "projects/img-db-fail",
      secureUrl: "https://res.cloudinary.com/demo/image/upload/v1/projects/img-db-fail.jpg",
      width: 800,
      height: 600,
      format: "jpg",
    };

    (uploadImage as unknown as any).mockResolvedValue(uploaded);
    (prisma.project.create as unknown as any).mockRejectedValue(
      new Error("Database create failed"),
    );

    const deleteImageMock = deleteImage as unknown as ReturnType<typeof vi.fn>;

    class DbFailFile {
      size: number;
      type: string;
      constructor(size: number, type: string) {
        this.size = size;
        this.type = type;
      }
      async arrayBuffer(): Promise<ArrayBuffer> {
        return new ArrayBuffer(0);
      }
    }

    const jpegFile = new DbFailFile(1024, "image/jpeg");

    const originalFile = (globalThis as any).File;
    (globalThis as any).File = DbFailFile as any;

    const fakeFormData = {
      get(key: string) {
        switch (key) {
          case "title":
            return "Project With DB Failure";
          case "description":
            return "DB create should fail after upload";
          case "category":
            return "Residential";
          case "featured":
            return "true";
          case "image":
            return jpegFile;
          default:
            return null;
        }
      },
    };

    const req = {
      formData: async () => fakeFormData,
    } as unknown as Request;

    const res = await POST(req);

    (globalThis as any).File = originalFile;

    expect(requireAdmin).toHaveBeenCalledWith(req as unknown as Request);
    expect(uploadImage).toHaveBeenCalledTimes(1);
    expect(prisma.project.create).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "Failed to create project" });
    expect(deleteImageMock).toHaveBeenCalledWith(uploaded.publicId);
  });
});
