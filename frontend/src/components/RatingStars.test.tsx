import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RatingStars } from './RatingStars';

describe('RatingStars', () => {
  describe('star rendering', () => {
    it('should render 5 stars for rating 5', () => {
      render(<RatingStars rating={5} />);
      const stars = screen.getByLabelText('5 out of 5 stars');
      expect(stars).toBeInTheDocument();
      // All 5 should be amber (full) stars
      const amberStars = stars.querySelectorAll('.text-amber-500');
      expect(amberStars).toHaveLength(5);
    });

    it('should render correct stars for rating 3.5', () => {
      render(<RatingStars rating={3.5} />);
      const stars = screen.getByLabelText('3.5 out of 5 stars');
      expect(stars).toBeInTheDocument();
      // Should have 3 full stars, 1 half star, 1 empty star
    });

    it('should render all empty stars for rating 0', () => {
      render(<RatingStars rating={0} />);
      const stars = screen.getByLabelText('0 out of 5 stars');
      expect(stars).toBeInTheDocument();
      const slateStars = stars.querySelectorAll('.text-slate-300');
      expect(slateStars).toHaveLength(5);
    });

    it('should clamp rating above 5 to 5 stars', () => {
      render(<RatingStars rating={7} />);
      const stars = screen.getByLabelText('7 out of 5 stars');
      expect(stars).toBeInTheDocument();
      // Should show 5 full amber stars, not 7
      const amberStars = stars.querySelectorAll('.text-amber-500');
      expect(amberStars).toHaveLength(5);
    });

    it('should clamp rating below 0 to 0 stars', () => {
      render(<RatingStars rating={-2} />);
      const stars = screen.getByLabelText('-2 out of 5 stars');
      expect(stars).toBeInTheDocument();
      const slateStars = stars.querySelectorAll('.text-slate-300');
      expect(slateStars).toHaveLength(5);
    });
  });

  describe('review count', () => {
    it('should display review count when provided', () => {
      render(<RatingStars rating={4} reviewCount={100} />);
      expect(screen.getByText('(100)')).toBeInTheDocument();
    });

    it('should not display review count when not provided', () => {
      render(<RatingStars rating={4} />);
      expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
    });

    it('should not display review count when null', () => {
      render(<RatingStars rating={4} reviewCount={null} />);
      expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
    });

    it('should display 0 review count', () => {
      render(<RatingStars rating={4} reviewCount={0} />);
      expect(screen.getByText('(0)')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have accessible label', () => {
      render(<RatingStars rating={4.5} reviewCount={50} />);
      expect(screen.getByLabelText('4.5 out of 5 stars')).toBeInTheDocument();
    });
  });
});
