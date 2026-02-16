/**
 * @file Navbar component tests.
 *
 * Verifies that the main navigation renders correctly and contains the expected
 * links (logo + Home, Projects, About, Contact). Navbar uses ThemeToggle, which
 * depends on next-themes, so we mock that provider to avoid missing context.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Navbar from "@/components/Navbar";

vi.mock("next-themes", async () => (await import("../../tests/mocks/next-themes")).default);

/**
 * Mock next-auth/react so useSession doesn't require a SessionProvider in the test.
 * Without this, useSession() would throw an error.
 */
vi.mock("next-auth/react", () => ({
	useSession: vi.fn(() => ({
		data: null,
		status: "unauthenticated",
	})),
	signOut: vi.fn(),
}));

describe("Navbar", () => {
	/** Ensures the nav landmark and logo link are present. */
	it("renders the navbar", () => {
		render(<Navbar />);
		expect(screen.getByRole("navigation")).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Shoreline Woodworks" })).toBeInTheDocument();
	});

	/**
	 * Asserts the four main nav items (Home, Projects, About, Contact) exist.
	 * Uses getByRole with name for accessibility-friendly queries.
	 */
	it("contains 4 navigation links", () => {
		render(<Navbar />);
		const home = screen.getByRole("link", { name: "Home" });
		const projects = screen.getByRole("link", { name: "Projects" });
		const about = screen.getByRole("link", { name: "About" });
		const contact = screen.getByRole("link", { name: "Contact" });

		expect(home).toBeInTheDocument();
		expect(projects).toBeInTheDocument();
		expect(about).toBeInTheDocument();
		expect(contact).toBeInTheDocument();

		const navLinks = [home, projects, about, contact];
		expect(navLinks).toHaveLength(4);
	});
});