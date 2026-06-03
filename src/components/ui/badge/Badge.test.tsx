import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Badge from "./Badge";

/**
 * Component tests for Badge (default export). Badge depends only on React, so no
 * mocking is needed. We assert observable DOM output:
 *   - children text renders.
 *   - the base + size + color variant classes are applied to the <span>.
 *   - startIcon / endIcon render inside their own wrapper spans (with mr-1/ml-1).
 */
describe("Badge", () => {
  it("renders its children text", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies base + default (md / light primary) classes", () => {
    render(<Badge>Default</Badge>);
    const span = screen.getByText("Default");

    // Base style.
    expect(span).toHaveClass("inline-flex");
    expect(span).toHaveClass("rounded-full");
    // Default size = md -> text-sm.
    expect(span).toHaveClass("text-sm");
    // Default variant=light, color=primary.
    expect(span).toHaveClass("bg-brand-50");
    expect(span).toHaveClass("text-brand-500");
  });

  it("applies the small size class when size='sm'", () => {
    render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText("Small")).toHaveClass("text-theme-xs");
  });

  it("applies solid variant color classes", () => {
    render(
      <Badge variant="solid" color="success">
        Won
      </Badge>,
    );
    const span = screen.getByText("Won");
    expect(span).toHaveClass("bg-success-500");
    expect(span).toHaveClass("text-white");
  });

  it("renders a startIcon inside an mr-1 wrapper", () => {
    render(<Badge startIcon={<svg data-testid="start-icon" />}>Lead</Badge>);

    const icon = screen.getByTestId("start-icon");
    expect(icon).toBeInTheDocument();
    // Wrapper span carries the leading-margin class.
    expect(icon.parentElement).toHaveClass("mr-1");
  });

  it("renders an endIcon inside an ml-1 wrapper", () => {
    render(<Badge endIcon={<svg data-testid="end-icon" />}>Trail</Badge>);

    const icon = screen.getByTestId("end-icon");
    expect(icon).toBeInTheDocument();
    expect(icon.parentElement).toHaveClass("ml-1");
  });

  it("does not render icon wrappers when no icons are passed", () => {
    render(<Badge>NoIcons</Badge>);
    const span = screen.getByText("NoIcons");
    // Only the text node — no child element wrappers.
    expect(span.querySelector("span")).toBeNull();
  });
});
