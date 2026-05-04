import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { BrandMark } from "@/components/brand/brand-mark";

describe("BrandMark", () => {
  it("renders an image with the academy logo and accessible alt", () => {
    render(<BrandMark size={64} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("alt", expect.stringMatching(/Академия/i));
  });

  it("respects the size prop on width and height", () => {
    render(<BrandMark size={120} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("width", "120");
    expect(img).toHaveAttribute("height", "120");
  });

  it("uses priority loading when isPriority is true (hero usage)", () => {
    render(<BrandMark size={240} isPriority />);
    const img = screen.getByRole("img");
    expect(img).not.toHaveAttribute("loading", "lazy");
  });
});
