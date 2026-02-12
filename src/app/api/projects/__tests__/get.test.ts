/**
 * Tests for the `GET /api/projects` route handler.
 *
 * These tests verify filtering, ordering, and error behavior of the projects
 * listing endpoint. We mock authentication and Prisma so that the tests focus
 * purely on how the handler builds its Prisma query and shapes the response.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";
import { prisma } from "@/lib/db";
import type { ProjectApiResponse } from "@/types/project";

// Mock auth to avoid pulling in next-auth/next during tests; the GET handler
// is public, so auth is irrelevant for these scenarios.
vi.mock("@/lib/auth", () => ({
    auth: vi.fn(),
}));

// Mock the Prisma client so we can precisely control the projects returned
// for each combination of query-string filters.
vi.mock("@/lib/db", () => ({
    prisma: {
        project: {
            findMany: vi.fn(),
        },
    },
}));

describe("GET /api/projects", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    // Mock projects data for testing
    const mockProjects: ProjectApiResponse[] = [
        {
            id: "1",
            title: "Oak Floor Refinishing - Downtown Condo",
            description:
                "Complete sanding and refinishing of original oak hardwood floors in a downtown residential condo.",
            category: "Residential",
            featured: true,
            imageUrl:
                "https://res.cloudinary.com/demo/image/upload/v1738791001/shoreline/projects/oak-condo.jpg",
            imagePublicId: "shoreline/projects/oak-condo",
            createdAt: "2026-02-06T10:15:00.000Z",
            updatedAt: "2026-02-06T10:15:00.000Z",
        },
        {
            id: "2",
            title: "Maple Hardwood Installation - Family Home",
            description:
                "Installed new maple hardwood flooring throughout the main floor of a detached family home.",
            category: "Residential",
            featured: false,
            imageUrl:
                "https://res.cloudinary.com/demo/image/upload/v1738791201/shoreline/projects/maple-install.jpg",
            imagePublicId: "shoreline/projects/maple-install",
            createdAt: "2026-02-05T14:30:00.000Z",
            updatedAt: "2026-02-05T14:30:00.000Z",
        },
        {
            id: "3",
            title: "Staircase Sanding & Staining",
            description:
                "Refinished residential staircase including sanding, staining, and protective polyurethane coating.",
            category: "Residential",
            featured: false,
            imageUrl:
                "https://res.cloudinary.com/demo/image/upload/v1738791401/shoreline/projects/staircase.jpg",
            imagePublicId: "shoreline/projects/staircase",
            createdAt: "2026-02-04T09:45:00.000Z",
            updatedAt: "2026-02-04T09:45:00.000Z",
        },
        {
            id: "4",
            title: "Commercial Showroom Flooring",
            description:
                "Installed durable engineered hardwood flooring in a high-traffic commercial showroom space.",
            category: "Commercial",
            featured: false,
            imageUrl:
                "https://res.cloudinary.com/demo/image/upload/v1738791601/shoreline/projects/showroom.jpg",
            imagePublicId: "shoreline/projects/showroom",
            createdAt: "2026-02-03T16:20:00.000Z",
            updatedAt: "2026-02-03T16:20:00.000Z",
        },
        {
            id: "5",
            title: "Gymnasium Floor Restoration",
            description:
                "Full restoration and sealing of a school gymnasium hardwood sports floor.",
            category: "Institutional",
            featured: false,
            imageUrl:
                "https://res.cloudinary.com/demo/image/upload/v1738791801/shoreline/projects/gym-floor.jpg",
            imagePublicId: "shoreline/projects/gym-floor",
            createdAt: "2026-02-02T11:10:00.000Z",
            updatedAt: "2026-02-02T11:10:00.000Z",
        },
    ];

    it("should return a list of projects with no filters", async () => {
        (prisma.project.findMany as any).mockResolvedValue(mockProjects);

        const req = new Request("http://localhost/api/projects");
        const res = await GET(req);

        expect(prisma.project.findMany).toHaveBeenCalledWith({
            where: {},
            orderBy: { createdAt: "desc" },
        });

        const body = await res.json();
        expect(body).toEqual(mockProjects);
    });

    it("should return a list of projects filtered by category", async () => {
        const residentialProjects = mockProjects.filter(
            (project: ProjectApiResponse) => project.category === "Residential",
        );
        (prisma.project.findMany as any).mockResolvedValue(residentialProjects);

        const req = new Request("http://localhost/api/projects?category=Residential");
        const res = await GET(req);

        expect(prisma.project.findMany).toHaveBeenCalledWith({
            where: { category: "Residential" },
            orderBy: { createdAt: "desc" },
        });

        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual(residentialProjects);
        expect(
            body.every((project: ProjectApiResponse) => project.category === "Residential"),
        ).toBe(true);
    });

    it("should return a list containing only the featured project", async () => {
        const featuredProjects = mockProjects.filter(
            (project: ProjectApiResponse) => project.featured,
        );
        (prisma.project.findMany as any).mockResolvedValue(featuredProjects);

        const req = new Request("http://localhost/api/projects?featured=true");
        const res = await GET(req);

        expect(prisma.project.findMany).toHaveBeenCalledWith({
            where: { featured: true },
            orderBy: { createdAt: "desc" },
        });

        const body = await res.json();
        expect(res.status).toBe(200);
        expect(body).toEqual(featuredProjects);
        expect((body[0] as ProjectApiResponse).featured).toBe(true);
        expect(body.length).toBe(1);
    });

    it("should return a list containing only the non-featured projects", async () => {
        const nonFeaturedProjects = mockProjects.filter(
            (project: ProjectApiResponse) => !project.featured,
        );
        (prisma.project.findMany as any).mockResolvedValue(nonFeaturedProjects);

        const req = new Request("http://localhost/api/projects?featured=false");
        const res = await GET(req);

        expect(prisma.project.findMany).toHaveBeenCalledWith({
            where: { featured: false },
            orderBy: { createdAt: "desc" },
        });

        const body = await res.json();
        expect(res.status).toBe(200);
        expect(body).toEqual(nonFeaturedProjects);
        expect(body.every((project: ProjectApiResponse) => !project.featured)).toBe(true);
        expect(body.length).toBe(mockProjects.length - 1);
    });

    it("should return a 500 error if the database query fails", async () => {
        (prisma.project.findMany as any).mockRejectedValue(new Error("Database query failed"));

        const req = new Request("http://localhost/api/projects");
        const res = await GET(req);

        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({ error: "Failed to fetch projects" });
    });

    it("should return projects filtered by both category and featured", async () => {
        const featuredResidentialProjects = mockProjects.filter(
            (project: ProjectApiResponse) =>
                project.category === "Residential" && project.featured === true,
        );
        (prisma.project.findMany as any).mockResolvedValue(featuredResidentialProjects);

        const req = new Request(
            "http://localhost/api/projects?category=Residential&featured=true",
        );
        const res = await GET(req);

        expect(prisma.project.findMany).toHaveBeenCalledWith({
            where: { category: "Residential", featured: true },
            orderBy: { createdAt: "desc" },
        });

        const body = await res.json();
        expect(res.status).toBe(200);
        expect(body).toEqual(featuredResidentialProjects);
        expect(body.every((project: ProjectApiResponse) => project.category === "Residential")).toBe(
            true,
        );
        expect(body.every((project: ProjectApiResponse) => project.featured === true)).toBe(true);
    });

    it("should return an empty array when no projects match the filters", async () => {
        (prisma.project.findMany as any).mockResolvedValue([]);

        const req = new Request("http://localhost/api/projects?category=NonExistent");
        const res = await GET(req);

        expect(prisma.project.findMany).toHaveBeenCalledWith({
            where: { category: "NonExistent" },
            orderBy: { createdAt: "desc" },
        });

        const body = await res.json();
        expect(res.status).toBe(200);
        expect(body).toEqual([]);
        expect(Array.isArray(body)).toBe(true);
    });

    it("should treat invalid featured value as false", async () => {
        const nonFeaturedProjects = mockProjects.filter(
            (project: ProjectApiResponse) => !project.featured,
        );
        (prisma.project.findMany as any).mockResolvedValue(nonFeaturedProjects);

        const req = new Request("http://localhost/api/projects?featured=invalid");
        const res = await GET(req);

        expect(prisma.project.findMany).toHaveBeenCalledWith({
            where: { featured: false },
            orderBy: { createdAt: "desc" },
        });

        const body = await res.json();
        expect(res.status).toBe(200);
        expect(body).toEqual(nonFeaturedProjects);
    });

    it("should ignore empty category parameter", async () => {
        (prisma.project.findMany as any).mockResolvedValue(mockProjects);

        const req = new Request("http://localhost/api/projects?category=");
        const res = await GET(req);

        expect(prisma.project.findMany).toHaveBeenCalledWith({
            where: {},
            orderBy: { createdAt: "desc" },
        });

        const body = await res.json();
        expect(res.status).toBe(200);
        expect(body).toEqual(mockProjects);
    });
});