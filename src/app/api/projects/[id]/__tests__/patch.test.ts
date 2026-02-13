/**
 * Tests for the `PATCH /api/projects/[id]` route handler.
 *
 * These tests verify admin-only update: auth via verifyAdmin, update via Prisma,
 * and optional Cloudinary upload/delete for image replace or remove. We mock
 * auth, database, and Cloudinary so tests run without live services.
 *
 * Scenarios covered:
 * - Success: admin updates a project with FormData (e.g. title only); handler
 *   returns 200 with the updated project.
 * - Not found: handler returns 404 when the project does not exist.
 * - Validation: title missing or whitespace-only → 400; invalid image type or
 *   image over 10MB → 400.
 * - Auth: 401 when session missing/invalid; 403 when not admin.
 * - Server error: 500 when the database or (for removeImage) Cloudinary fails.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "../route";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth-guards";
import { uploadImage, deleteImage } from "@/lib/cloudinary";
import { mockProjects } from "../../__tests__/fixtures";
import type { ProjectApiResponse } from "@/types/project";

// Mock auth guard used by the PATCH handler so we can simulate admin vs
// unauthenticated/forbidden outcomes.
vi.mock("@/lib/auth-guards", () => ({
    verifyAdmin: vi.fn(),
}));

// Mock Prisma so route tests never depend on a live database.
vi.mock("@/lib/db", () => ({
    prisma: {
        project: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    },
}));

// Mock Cloudinary so we avoid real uploads/deletions and only assert calls.
vi.mock("@/lib/cloudinary", () => ({
    uploadImage: vi.fn(),
    deleteImage: vi.fn(),
}));

describe("PATCH /api/projects/[id]", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * When the project exists and the admin sends valid FormData (e.g. title only),
     * the handler must call update with the correct data and return 200 with the
     * updated project. No image upload or delete is involved when only fields like
     * title are sent.
     */
    it("should return 200 with the updated project when the project was successfully updated", async () => {
        (verifyAdmin as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            user: { isAdmin: true },
        });

        const existing = mockProjects[0];
        const updatedProject: ProjectApiResponse = {
            ...existing,
            title: "Updated Title",
            updatedAt: "2026-02-12T12:00:00.000Z",
        };

        (prisma.project.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(existing);
        (prisma.project.update as ReturnType<typeof vi.fn>).mockResolvedValue(updatedProject);

        const formData = new FormData();
        formData.set("title", "Updated Title   ");

        const params = Promise.resolve({ id: existing.id });
        const req = new Request(`http://localhost/api/projects/${existing.id}`, {
            method: "PATCH",
            body: formData,
        });
        const res = await PATCH(req, { params });

        expect(verifyAdmin).toHaveBeenCalledWith(req, { params });
        expect(prisma.project.findUnique).toHaveBeenCalledWith({
            where: { id: existing.id },
        });
        expect(prisma.project.update).toHaveBeenCalledWith({
            where: { id: existing.id },
            data: {
                title: "Updated Title",
                description: existing.description,
                category: existing.category,
                featured: existing.featured,
                imageUrl: existing.imageUrl,
                imagePublicId: existing.imagePublicId,
            },
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toEqual(updatedProject);
        expect(body.title).toBe(updatedProject.title.trim());
        expect(uploadImage).not.toHaveBeenCalled();
        expect(deleteImage).not.toHaveBeenCalled();
    });

    /**
     * When FormData is invalid because title is missing from the payload, the
     * handler must return 400 with { error: "Title is required" } and must not
     * call update, uploadImage, or deleteImage.
     */
    it("should return 400 when title is missing from the payload", async () => {
        (verifyAdmin as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            user: { isAdmin: true },
        });

        const existing = mockProjects[0];
        (prisma.project.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(existing);

        const formData = new FormData();
        formData.set("description", "Only description, no title");

        const params = Promise.resolve({ id: existing.id });
        const req = new Request(`http://localhost/api/projects/${existing.id}`, {
            method: "PATCH",
            body: formData,
        });
        const res = await PATCH(req, { params });

        expect(verifyAdmin).toHaveBeenCalledWith(req, { params });
        expect(prisma.project.findUnique).toHaveBeenCalledWith({
            where: { id: existing.id },
        });
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body).toEqual({ error: "Title is required" });
        expect(prisma.project.update).not.toHaveBeenCalled();
        expect(uploadImage).not.toHaveBeenCalled();
        expect(deleteImage).not.toHaveBeenCalled();
    });

    /**
     * When the title field is set but is only whitespace, the handler must return
     * 400 with { error: "Title is required" } and must not call update, uploadImage,
     * or deleteImage.
     */
    it("should return 400 when title is set but is only whitespace", async () => {
        (verifyAdmin as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            user: { isAdmin: true },
        });

        const existing = mockProjects[0];
        (prisma.project.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(existing);

        const formData = new FormData();
        formData.set("title", "   ");

        const params = Promise.resolve({ id: existing.id });
        const req = new Request(`http://localhost/api/projects/${existing.id}`, {
            method: "PATCH",
            body: formData,
        });
        const res = await PATCH(req, { params });

        expect(verifyAdmin).toHaveBeenCalledWith(req, { params });
        expect(prisma.project.findUnique).toHaveBeenCalledWith({
            where: { id: existing.id },
        });
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body).toEqual({ error: "Title is required" });
        expect(prisma.project.update).not.toHaveBeenCalled();
        expect(uploadImage).not.toHaveBeenCalled();
        expect(deleteImage).not.toHaveBeenCalled();
    });

    /**
     * When a new image is provided but its size is greater than 10MB, the handler
     * must return 400 with the size-limit error and must not call uploadImage or update.
     */
    it("should return 400 when the image file is greater than 10MB", async () => {
        (verifyAdmin as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            user: { isAdmin: true },
        });

        const existing = mockProjects[0];
        (prisma.project.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(existing);

        const largeFile = new File(
            [new ArrayBuffer(10 * 1024 * 1024 + 1)],
            "large.jpg",
            { type: "image/jpeg" },
        );

        const fakeFormData = {
            get(key: string): string | File | null {
                if (key === "title") return "Valid Title";
                if (key === "image") return largeFile;
                return null;
            },
        };

        const params = Promise.resolve({ id: existing.id });
        const req = {
            formData: async () => fakeFormData,
        } as unknown as Request;
        const res = await PATCH(req, { params });

        expect(verifyAdmin).toHaveBeenCalledWith(req, { params });
        expect(prisma.project.findUnique).toHaveBeenCalledWith({
            where: { id: existing.id },
        });
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body).toEqual({ error: "Image file is too large (max 10MB)" });
        expect(prisma.project.update).not.toHaveBeenCalled();
        expect(uploadImage).not.toHaveBeenCalled();
        expect(deleteImage).not.toHaveBeenCalled();
    });

    /**
     * Only allowed image types (jpeg, jpg, png, webp, gif) are accepted when
     * updating the project image. An unsupported MIME type (e.g. image/svg+xml)
     * must be rejected with 400 and the documented allowed-types error message;
     * uploadImage and update must not be called.
     */
    it("should return 400 when the image has an unsupported MIME type", async () => {
        (verifyAdmin as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            user: { isAdmin: true },
        });

        const existing = mockProjects[0];
        (prisma.project.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(existing);

        const svgFile = new File(
            [new ArrayBuffer(1)],
            "image.svg",
            { type: "image/svg+xml" },
        );

        const fakeFormData = {
            get(key: string): string | File | null {
                if (key === "title") return "Valid Title";
                if (key === "image") return svgFile;
                return null;
            },
        };

        const params = Promise.resolve({ id: existing.id });
        const req = {
            formData: async () => fakeFormData,
        } as unknown as Request;
        const res = await PATCH(req, { params });

        expect(verifyAdmin).toHaveBeenCalledWith(req, { params });
        expect(prisma.project.findUnique).toHaveBeenCalledWith({
            where: { id: existing.id },
        });
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body).toEqual({
            error:
                "Invalid image type. Allowed: image/jpeg, image/jpg, image/png, image/webp, image/gif",
        });
        expect(prisma.project.update).not.toHaveBeenCalled();
        expect(uploadImage).not.toHaveBeenCalled();
        expect(deleteImage).not.toHaveBeenCalled();
    });

    /**
     * When no project exists for the requested id, the handler must return 404
     * with a consistent error body and must not call update, uploadImage, or deleteImage.
     */
    it("should return 404 when the project does not exist", async () => {
        (verifyAdmin as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            user: { isAdmin: true },
        });
        (prisma.project.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

        const formData = new FormData();
        formData.set("title", "Some Title");

        const params = Promise.resolve({ id: "nonexistent" });
        const req = new Request("http://localhost/api/projects/nonexistent", {
            method: "PATCH",
            body: formData,
        });
        const res = await PATCH(req, { params });

        expect(verifyAdmin).toHaveBeenCalledWith(req, { params });
        expect(prisma.project.findUnique).toHaveBeenCalledWith({
            where: { id: "nonexistent" },
        });
        expect(res.status).toBe(404);
        const body = await res.json();
        expect(body).toEqual({ error: "Project not found" });
        expect(prisma.project.update).not.toHaveBeenCalled();
        expect(uploadImage).not.toHaveBeenCalled();
        expect(deleteImage).not.toHaveBeenCalled();
    });

    /**
     * When the session is missing or invalid, verifyAdmin returns a 401 response;
     * the handler must return that response and must not touch the database or Cloudinary.
     */
    it("should return 401 when the session is missing or invalid", async () => {
        (verifyAdmin as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            response: new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
            }),
        });

        const params = Promise.resolve({ id: "1" });
        const req = new Request("http://localhost/api/projects/1", {
            method: "PATCH",
            body: new FormData(),
        });
        const res = await PATCH(req, { params });

        expect(verifyAdmin).toHaveBeenCalledWith(req, { params });
        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body).toEqual({ error: "Unauthorized" });
        expect(prisma.project.findUnique).not.toHaveBeenCalled();
        expect(prisma.project.update).not.toHaveBeenCalled();
        expect(uploadImage).not.toHaveBeenCalled();
        expect(deleteImage).not.toHaveBeenCalled();
    });

    /**
     * When the user is authenticated but not an admin, verifyAdmin returns 403
     * Forbidden; the handler must return that response and must not touch the database or Cloudinary.
     */
    it("should return 403 when the user is authenticated but NOT an admin", async () => {
        (verifyAdmin as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            response: new Response(JSON.stringify({ error: "Forbidden" }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
            }),
        });

        const params = Promise.resolve({ id: "1" });
        const req = new Request("http://localhost/api/projects/1", {
            method: "PATCH",
            body: new FormData(),
        });
        const res = await PATCH(req, { params });

        expect(verifyAdmin).toHaveBeenCalledWith(req, { params });
        expect(res.status).toBe(403);
        const body = await res.json();
        expect(body).toEqual({ error: "Forbidden" });
        expect(prisma.project.findUnique).not.toHaveBeenCalled();
        expect(prisma.project.update).not.toHaveBeenCalled();
        expect(uploadImage).not.toHaveBeenCalled();
        expect(deleteImage).not.toHaveBeenCalled();
    });

    /**
     * If the database throws (e.g. update fails), the handler catches and returns
     * 500 with a generic message so we don't leak internal details to the client.
     */
    it("should return 500 when there is an issue with the database", async () => {
        (verifyAdmin as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            user: { isAdmin: true },
        });

        const existing = mockProjects[0];
        (prisma.project.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(existing);
        (prisma.project.update as ReturnType<typeof vi.fn>).mockRejectedValue(
            new Error("Database connection lost"),
        );

        const formData = new FormData();
        formData.set("title", "Updated Title");

        const params = Promise.resolve({ id: existing.id });
        const req = new Request(`http://localhost/api/projects/${existing.id}`, {
            method: "PATCH",
            body: formData,
        });
        const res = await PATCH(req, { params });

        expect(verifyAdmin).toHaveBeenCalledWith(req, { params });
        expect(prisma.project.findUnique).toHaveBeenCalledWith({
            where: { id: existing.id },
        });
        expect(prisma.project.update).toHaveBeenCalled();
        expect(res.status).toBe(500);
        const body = await res.json();
        expect(body).toEqual({ error: "Failed to update project" });
    });
});
