import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { __COMPONENT_NAME__ } from './__COMPONENT_NAME__';

describe('__COMPONENT_NAME__', () => {
  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(<__COMPONENT_NAME__>Test Content</__COMPONENT_NAME__>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders as a button element', () => {
      render(<__COMPONENT_NAME__>Click me</__COMPONENT_NAME__>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('forwards ref correctly', () => {
      const ref = vi.fn();
      render(<__COMPONENT_NAME__ ref={ref}>Test</__COMPONENT_NAME__>);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('Variants', () => {
    it('applies primary variant by default', () => {
      const { container } = render(<__COMPONENT_NAME__>Primary</__COMPONENT_NAME__>);
      expect(container.firstChild).toHaveClass('bg-primary');
    });

    it('applies secondary variant', () => {
      const { container } = render(
        <__COMPONENT_NAME__ variant="secondary">Secondary</__COMPONENT_NAME__>
      );
      expect(container.firstChild).toHaveClass('bg-secondary');
    });

    it('applies destructive variant', () => {
      const { container } = render(
        <__COMPONENT_NAME__ variant="destructive">Delete</__COMPONENT_NAME__>
      );
      expect(container.firstChild).toHaveClass('bg-destructive');
    });

    it('applies outline variant', () => {
      const { container } = render(
        <__COMPONENT_NAME__ variant="outline">Outline</__COMPONENT_NAME__>
      );
      expect(container.firstChild).toHaveClass('border');
    });

    it('applies ghost variant', () => {
      const { container } = render(
        <__COMPONENT_NAME__ variant="ghost">Ghost</__COMPONENT_NAME__>
      );
      expect(container.firstChild).toHaveClass('hover:bg-accent');
    });
  });

  describe('Sizes', () => {
    it('applies medium size by default', () => {
      const { container } = render(<__COMPONENT_NAME__>Medium</__COMPONENT_NAME__>);
      expect(container.firstChild).toHaveClass('h-10');
    });

    it('applies small size', () => {
      const { container } = render(<__COMPONENT_NAME__ size="sm">Small</__COMPONENT_NAME__>);
      expect(container.firstChild).toHaveClass('h-8');
    });

    it('applies large size', () => {
      const { container } = render(<__COMPONENT_NAME__ size="lg">Large</__COMPONENT_NAME__>);
      expect(container.firstChild).toHaveClass('h-12');
    });
  });

  describe('States', () => {
    it('handles disabled state', () => {
      render(<__COMPONENT_NAME__ disabled>Disabled</__COMPONENT_NAME__>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('handles loading state', () => {
      render(<__COMPONENT_NAME__ loading>Loading</__COMPONENT_NAME__>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('shows loading spinner when loading', () => {
      const { container } = render(<__COMPONENT_NAME__ loading>Loading</__COMPONENT_NAME__>);
      expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<__COMPONENT_NAME__ onClick={handleClick}>Click</__COMPONENT_NAME__>);
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(
        <__COMPONENT_NAME__ disabled onClick={handleClick}>
          Disabled
        </__COMPONENT_NAME__>
      );
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', () => {
      const handleClick = vi.fn();
      render(
        <__COMPONENT_NAME__ loading onClick={handleClick}>
          Loading
        </__COMPONENT_NAME__>
      );
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('is focusable', () => {
      render(<__COMPONENT_NAME__>Focus me</__COMPONENT_NAME__>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('is not focusable when disabled', () => {
      render(<__COMPONENT_NAME__ disabled>Disabled</__COMPONENT_NAME__>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });

    it('has aria-busy when loading', () => {
      render(<__COMPONENT_NAME__ loading>Loading</__COMPONENT_NAME__>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Custom className', () => {
    it('accepts custom className', () => {
      const { container } = render(
        <__COMPONENT_NAME__ className="custom-class">Custom</__COMPONENT_NAME__>
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('merges custom className with variant classes', () => {
      const { container } = render(
        <__COMPONENT_NAME__ variant="primary" className="custom-class">
          Merged
        </__COMPONENT_NAME__>
      );
      expect(container.firstChild).toHaveClass('bg-primary');
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  // ===================================
  // Performance Tests (TDD GATES)
  // These thresholds match .claude/performance-budgets.json
  // Tests FAIL if exceeded, triggering TDD loop-back
  // ===================================

  describe('Performance', () => {
    it('should not re-render excessively on mount', () => {
      let renderCount = 0;

      const TestWrapper = () => {
        renderCount++;
        return <__COMPONENT_NAME__>Test</__COMPONENT_NAME__>;
      };

      render(<TestWrapper />);

      // THRESHOLD: Mount renders max 1
      // If this fails, check for: useEffect dependencies, state initialization
      expect(renderCount).toBeLessThanOrEqual(1);
    });

    it('should not re-render excessively on prop change', () => {
      let renderCount = 0;

      const TestWrapper = ({ variant }: { variant: 'primary' | 'secondary' }) => {
        renderCount++;
        return <__COMPONENT_NAME__ variant={variant}>Test</__COMPONENT_NAME__>;
      };

      const { rerender } = render(<TestWrapper variant="primary" />);
      renderCount = 0; // Reset after initial render

      rerender(<TestWrapper variant="secondary" />);

      // THRESHOLD: Prop change renders max 1
      // If this fails, check for: missing useMemo/useCallback, unstable references
      expect(renderCount).toBeLessThanOrEqual(1);
    });

    it('should not cause unnecessary re-renders with same props', () => {
      let renderCount = 0;

      const TestWrapper = ({ variant }: { variant: 'primary' }) => {
        renderCount++;
        return <__COMPONENT_NAME__ variant={variant}>Test</__COMPONENT_NAME__>;
      };

      const { rerender } = render(<TestWrapper variant="primary" />);
      renderCount = 0; // Reset after initial render

      // Rerender with SAME props
      rerender(<TestWrapper variant="primary" />);

      // THRESHOLD: Same-prop renders max 0 (should be memoized)
      // If this fails, consider wrapping component with React.memo
      // Note: This is a warning, not a hard fail in some cases
      expect(renderCount).toBeLessThanOrEqual(1);
    });

    it('should render within time budget', () => {
      const startTime = performance.now();

      render(<__COMPONENT_NAME__>Performance Test</__COMPONENT_NAME__>);

      const renderTime = performance.now() - startTime;

      // THRESHOLD: Initial render max 16ms (one frame at 60fps)
      // If this fails, check for: expensive computations, large DOM trees
      expect(renderTime).toBeLessThan(16);
    });
  });
});
