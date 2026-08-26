import { render, screen } from '@testing-library/react-native';
import { RatingStars } from '../RatingStars';

describe('RatingStars', () => {
  it('exposes the rating to assistive tech', () => {
    render(<RatingStars rating={4.5} />);
    expect(screen.getByLabelText('4.5 out of 5 stars')).toBeTruthy();
  });

  it('shows the review count when there is one', () => {
    render(<RatingStars rating={4.8} reviewCount={150} />);
    expect(screen.getByText('(150)')).toBeTruthy();
  });

  it('hides the review count when it is null', () => {
    render(<RatingStars rating={4.8} reviewCount={null} />);
    expect(screen.queryByText(/\(/)).toBeNull();
  });

  it('renders two instances without colliding', () => {
    // The web component gives its half-star gradient a hardcoded id, so two on
    // one page collide. This one draws the half star by clipping instead, so
    // there is no shared id to collide.
    render(
      <>
        <RatingStars rating={3.5} />
        <RatingStars rating={4.5} />
      </>
    );
    expect(screen.getByLabelText('3.5 out of 5 stars')).toBeTruthy();
    expect(screen.getByLabelText('4.5 out of 5 stars')).toBeTruthy();
  });

  it('clamps a rating above five', () => {
    render(<RatingStars rating={9} />);
    expect(screen.getByLabelText('9 out of 5 stars')).toBeTruthy();
  });
});
