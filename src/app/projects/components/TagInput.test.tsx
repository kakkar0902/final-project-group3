/**
 * @file TagInput component tests.
 *
 * Verifies rendering of tags, adding tags (comma/Enter/click suggestion),
 * removing tags (button/Backspace), suggestions (static and fetch), and
 * keyboard behavior (Arrow keys, Escape).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TagInput from "./TagInput";

describe("TagInput", () => {
  const defaultProps = {
    value: [] as string[],
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Render", () => {
    it("renders input with default placeholder when no tags", () => {
      render(<TagInput {...defaultProps} />);
      expect(screen.getByRole("textbox", { name: "Add tags" })).toHaveAttribute(
        "placeholder",
        "Add tags (comma or click outside)",
      );
    });

    it("renders custom placeholder when provided", () => {
      render(
        <TagInput {...defaultProps} placeholder="Type a tag, then comma" />,
      );
      expect(screen.getByRole("textbox", { name: "Add tags" })).toHaveAttribute(
        "placeholder",
        "Type a tag, then comma",
      );
    });

    it("renders existing tags with remove buttons", () => {
      render(
        <TagInput {...defaultProps} value={["Residential", "Commercial"]} />,
      );
      expect(screen.getByText("Residential")).toBeInTheDocument();
      expect(screen.getByText("Commercial")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Remove Residential" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Remove Commercial" })).toBeInTheDocument();
    });

    it("hides placeholder when tags exist", () => {
      render(<TagInput {...defaultProps} value={["One"]} />);
      expect(screen.getByRole("textbox", { name: "Add tags" })).toHaveAttribute(
        "placeholder",
        "",
      );
    });

    it("uses id when provided", () => {
      render(<TagInput {...defaultProps} id="tags" />);
      expect(screen.getByRole("textbox", { name: "Add tags" })).toHaveAttribute("id", "tags");
    });
  });

  describe("Adding tags", () => {
    it("adds tag on comma and normalizes to title case", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TagInput {...defaultProps} value={[]} onChange={onChange} />);

      await user.type(screen.getByRole("textbox", { name: "Add tags" }), "residential,");

      expect(onChange).toHaveBeenCalledWith(["Residential"]);
    });

    it("adds tag on Enter", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TagInput {...defaultProps} value={[]} onChange={onChange} />);

      await user.type(screen.getByRole("textbox", { name: "Add tags" }), "custom{Enter}");

      expect(onChange).toHaveBeenCalledWith(["Custom"]);
    });

    it("does not add duplicate tag (same normalized)", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <TagInput {...defaultProps} value={["Residential"]} onChange={onChange} />,
      );

      await user.type(screen.getByRole("textbox", { name: "Add tags" }), "residential,");

      expect(onChange).not.toHaveBeenCalled();
    });

    it("does not add empty tag", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<TagInput {...defaultProps} value={[]} onChange={onChange} />);

      await user.type(screen.getByRole("textbox", { name: "Add tags" }), "  ,");

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("Removing tags", () => {
    it("removes tag when clicking remove button", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <TagInput {...defaultProps} value={["A", "B"]} onChange={onChange} />,
      );

      await user.click(screen.getByRole("button", { name: "Remove A" }));

      expect(onChange).toHaveBeenCalledWith(["B"]);
    });

    it("removes last tag on Backspace when input is empty", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <TagInput {...defaultProps} value={["First", "Last"]} onChange={onChange} />,
      );

      const input = screen.getByRole("textbox", { name: "Add tags" });
      await user.click(input);
      await user.keyboard("{Backspace}");

      expect(onChange).toHaveBeenCalledWith(["First"]);
    });
  });

  describe("Static suggestions", () => {
    it("shows filtered suggestions when typing", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          {...defaultProps}
          value={[]}
          suggestions={["Residential", "Commercial", "Custom"]}
        />,
      );

      await user.type(screen.getByRole("textbox", { name: "Add tags" }), "res");

      await waitFor(
        () => {
          expect(screen.getByRole("listbox", { name: "Tag suggestions" })).toBeInTheDocument();
          expect(screen.getByText("Residential")).toBeInTheDocument();
          expect(screen.queryByText("Commercial")).not.toBeInTheDocument();
        },
        { timeout: 300 },
      );
    });

    it("does not suggest already added tags", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          {...defaultProps}
          value={["Residential"]}
          suggestions={["Residential", "Commercial"]}
        />,
      );

      await user.type(screen.getByRole("textbox", { name: "Add tags" }), "r");

      await waitFor(
        () => {
          const listbox = screen.queryByRole("listbox", { name: "Tag suggestions" });
          if (listbox) {
            expect(screen.queryByText("Residential")).not.toBeInTheDocument();
            expect(screen.getByText("Commercial")).toBeInTheDocument();
          }
        },
        { timeout: 300 },
      );
    });

    it("adds tag when clicking a suggestion", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <TagInput
          {...defaultProps}
          value={[]}
          onChange={onChange}
          suggestions={["Residential", "Commercial"]}
        />,
      );

      await user.type(screen.getByRole("textbox", { name: "Add tags" }), "res");

      await waitFor(
        () => {
          expect(screen.getByRole("listbox", { name: "Tag suggestions" })).toBeInTheDocument();
        },
        { timeout: 300 },
      );

      await user.click(screen.getByRole("option", { name: "Residential" }));

      expect(onChange).toHaveBeenCalledWith(["Residential"]);
    });
  });

  describe("Fetch suggestions", () => {
    it("calls fetchSuggestions when typing and shows results", async () => {
      const user = userEvent.setup();
      const fetchSuggestions = vi.fn().mockResolvedValue(["Fetched One", "Fetched Two"]);
      render(
        <TagInput
          {...defaultProps}
          value={[]}
          fetchSuggestions={fetchSuggestions}
        />,
      );

      await user.type(screen.getByRole("textbox", { name: "Add tags" }), "fet");

      await waitFor(
        () => {
          expect(fetchSuggestions).toHaveBeenCalledWith("fet");
        },
        { timeout: 300 },
      );

      await waitFor(
        () => {
          expect(screen.getByText("Fetched One")).toBeInTheDocument();
          expect(screen.getByText("Fetched Two")).toBeInTheDocument();
        },
        { timeout: 300 },
      );
    });

    it("falls back to static suggestions when fetchSuggestions fails", async () => {
      const user = userEvent.setup();
      const fetchSuggestions = vi.fn().mockRejectedValue(new Error("Network error"));
      render(
        <TagInput
          {...defaultProps}
          value={[]}
          suggestions={["Fallback"]}
          fetchSuggestions={fetchSuggestions}
        />,
      );

      await user.type(screen.getByRole("textbox", { name: "Add tags" }), "fall");

      await waitFor(
        () => {
          expect(fetchSuggestions).toHaveBeenCalled();
        },
        { timeout: 300 },
      );

      await waitFor(
        () => {
          expect(screen.getByText("Fallback")).toBeInTheDocument();
        },
        { timeout: 300 },
      );
    });
  });

  describe("Keyboard", () => {
    it("Escape closes suggestions and blurs input", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          {...defaultProps}
          value={[]}
          suggestions={["Residential"]}
        />,
      );

      await user.type(screen.getByRole("textbox", { name: "Add tags" }), "r");
      await waitFor(
        () => {
          expect(screen.getByRole("listbox", { name: "Tag suggestions" })).toBeInTheDocument();
        },
        { timeout: 300 },
      );

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByRole("listbox", { name: "Tag suggestions" })).not.toBeInTheDocument();
      });

      expect(screen.getByRole("textbox", { name: "Add tags" })).not.toHaveFocus();
    });

    it("Arrow Down highlights next suggestion; Enter adds it", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <TagInput
          {...defaultProps}
          value={[]}
          onChange={onChange}
          suggestions={["First", "Second", "Third"]}
        />,
      );

      await user.type(screen.getByRole("textbox", { name: "Add tags" }), "s");
      await waitFor(
        () => {
          expect(screen.getByRole("listbox", { name: "Tag suggestions" })).toBeInTheDocument();
        },
        { timeout: 300 },
      );

      await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

      expect(onChange).toHaveBeenCalledWith(["Second"]);
    });

    it("Arrow Up moves highlight up", async () => {
      const user = userEvent.setup();
      render(
        <TagInput
          {...defaultProps}
          value={[]}
          suggestions={["Alpha", "Beta"]}
        />,
      );

      await user.type(screen.getByRole("textbox", { name: "Add tags" }), "a");
      await waitFor(
        () => {
          expect(screen.getByRole("listbox", { name: "Tag suggestions" })).toBeInTheDocument();
        },
        { timeout: 300 },
      );

      await user.keyboard("{ArrowDown}{ArrowDown}");
      const betaOption = screen.getByRole("option", { name: "Beta" });
      const alphaOption = screen.getByRole("option", { name: "Alpha" });
      expect(betaOption).toHaveAttribute("aria-selected", "true");
      await user.keyboard("{ArrowUp}");
      expect(alphaOption).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("Click outside", () => {
    it("commits current input on mousedown outside", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <TagInput {...defaultProps} value={[]} onChange={onChange} />,
      );

      await user.type(screen.getByRole("textbox", { name: "Add tags" }), "new tag");
      await user.click(document.body);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(["New Tag"]);
      });
    });
  });
});
