/**
 * @file ProjectsReorderBar component tests.
 *
 * Verifies that ProjectsReorderBar renders the correct buttons based on reorder mode,
 * handles button clicks correctly, and shows appropriate loading states.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectsReorderBar from "./ProjectsReorderBar";

describe("ProjectsReorderBar", () => {
  const mockOnEnterReorderMode = vi.fn();
  const mockOnCancelReorder = vi.fn();
  const mockOnSaveOrder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Verifies that when not in reorder mode, the component shows only the
   * "Edit order" button.
   */
  it("shows Edit order button when not in reorder mode", () => {
    render(
      <ProjectsReorderBar
        isReorderMode={false}
        isSavingOrder={false}
        onEnterReorderMode={mockOnEnterReorderMode}
        onCancelReorder={mockOnCancelReorder}
        onSaveOrder={mockOnSaveOrder}
      />,
    );
    expect(screen.getByRole("button", { name: "Edit order" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save order" })).not.toBeInTheDocument();
  });

  /**
   * Verifies that clicking the "Edit order" button calls onEnterReorderMode.
   */
  it("calls onEnterReorderMode when Edit order button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ProjectsReorderBar
        isReorderMode={false}
        isSavingOrder={false}
        onEnterReorderMode={mockOnEnterReorderMode}
        onCancelReorder={mockOnCancelReorder}
        onSaveOrder={mockOnSaveOrder}
      />,
    );
    const editButton = screen.getByRole("button", { name: "Edit order" });
    await user.click(editButton);
    expect(mockOnEnterReorderMode).toHaveBeenCalledTimes(1);
  });

  /**
   * Verifies that when in reorder mode, the component shows "Cancel" and
   * "Save order" buttons instead of "Edit order".
   */
  it("shows Cancel and Save order buttons when in reorder mode", () => {
    render(
      <ProjectsReorderBar
        isReorderMode={true}
        isSavingOrder={false}
        onEnterReorderMode={mockOnEnterReorderMode}
        onCancelReorder={mockOnCancelReorder}
        onSaveOrder={mockOnSaveOrder}
      />,
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save order" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit order" })).not.toBeInTheDocument();
  });

  /**
   * Verifies that clicking the "Cancel" button calls onCancelReorder.
   */
  it("calls onCancelReorder when Cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ProjectsReorderBar
        isReorderMode={true}
        isSavingOrder={false}
        onEnterReorderMode={mockOnEnterReorderMode}
        onCancelReorder={mockOnCancelReorder}
        onSaveOrder={mockOnSaveOrder}
      />,
    );
    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelButton);
    expect(mockOnCancelReorder).toHaveBeenCalledTimes(1);
  });

  /**
   * Verifies that clicking the "Save order" button calls onSaveOrder.
   */
  it("calls onSaveOrder when Save order button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ProjectsReorderBar
        isReorderMode={true}
        isSavingOrder={false}
        onEnterReorderMode={mockOnEnterReorderMode}
        onCancelReorder={mockOnCancelReorder}
        onSaveOrder={mockOnSaveOrder}
      />,
    );
    const saveButton = screen.getByRole("button", { name: "Save order" });
    await user.click(saveButton);
    expect(mockOnSaveOrder).toHaveBeenCalledTimes(1);
  });

  /**
   * Verifies that when isSavingOrder is true, the "Save order" button shows
   * "Saving…" text and is disabled.
   */
  it("shows 'Saving…' text and disables Save order button when isSavingOrder is true", () => {
    render(
      <ProjectsReorderBar
        isReorderMode={true}
        isSavingOrder={true}
        onEnterReorderMode={mockOnEnterReorderMode}
        onCancelReorder={mockOnCancelReorder}
        onSaveOrder={mockOnSaveOrder}
      />,
    );
    const saveButton = screen.getByRole("button", { name: "Saving…" });
    expect(saveButton).toBeDisabled();
  });

  /**
   * Verifies that when isSavingOrder is true, the "Cancel" button is also disabled.
   */
  it("disables Cancel button when isSavingOrder is true", () => {
    render(
      <ProjectsReorderBar
        isReorderMode={true}
        isSavingOrder={true}
        onEnterReorderMode={mockOnEnterReorderMode}
        onCancelReorder={mockOnCancelReorder}
        onSaveOrder={mockOnSaveOrder}
      />,
    );
    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    expect(cancelButton).toBeDisabled();
  });

  /**
   * Verifies that when isSavingOrder is false, both Cancel and Save order buttons
   * are enabled.
   */
  it("enables Cancel and Save order buttons when isSavingOrder is false", () => {
    render(
      <ProjectsReorderBar
        isReorderMode={true}
        isSavingOrder={false}
        onEnterReorderMode={mockOnEnterReorderMode}
        onCancelReorder={mockOnCancelReorder}
        onSaveOrder={mockOnSaveOrder}
      />,
    );
    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    const saveButton = screen.getByRole("button", { name: "Save order" });
    expect(cancelButton).not.toBeDisabled();
    expect(saveButton).not.toBeDisabled();
  });
});
