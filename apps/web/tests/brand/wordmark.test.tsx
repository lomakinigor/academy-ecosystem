import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { Wordmark } from "@/components/brand/wordmark";

describe("Wordmark", () => {
  it("renders three lines stacked in three-line variant", () => {
    render(<Wordmark variant="three-line" />);
    expect(screen.getByText("АКАДЕМИЯ")).toBeInTheDocument();
    expect(screen.getByText("РАЗВИТИЯ")).toBeInTheDocument();
    expect(screen.getByText("ЧЕЛОВЕКА")).toBeInTheDocument();
  });

  it("renders one combined string in one-line variant", () => {
    render(<Wordmark variant="one-line" />);
    expect(screen.getByText("АКАДЕМИЯ РАЗВИТИЯ ЧЕЛОВЕКА")).toBeInTheDocument();
  });

  it("emphasises the middle word with brand-accent class in three-line variant", () => {
    render(<Wordmark variant="three-line" />);
    const middle = screen.getByText("РАЗВИТИЯ");
    expect(middle.className).toMatch(/text-brand-accent/);
  });

  it("uses heading semantics so screen readers announce a single brand label", () => {
    const { container } = render(<Wordmark variant="three-line" />);
    expect(container.querySelector("[aria-label]")).toHaveAttribute(
      "aria-label",
      "Академия Развития Человека",
    );
  });
});
