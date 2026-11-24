import { useWindowDimensions } from 'react-native';

// Size classes for the assignment review screen (mockup: Laptop, Tablet,
// Mobile, TV). TV gets bigger type and a focus ring for remote navigation.
export type ReviewSize = 'mobile' | 'tablet' | 'laptop' | 'tv';

export function reviewSizeFor(width: number): ReviewSize {
  if (width < 600) return 'mobile';
  if (width < 1024) return 'tablet';
  if (width < 1600) return 'laptop';
  return 'tv';
}

export function useReviewLayout() {
  const { width } = useWindowDimensions();
  const size = reviewSizeFor(width);
  const scale = size === 'tv' ? 1.3 : size === 'mobile' ? 0.94 : 1;
  return {
    size,
    width,
    isMobile: size === 'mobile',
    isTablet: size === 'tablet',
    isTV: size === 'tv',
    // Font size helper: fs(16) → 16 on laptop, ~21 on TV.
    fs: (n: number) => Math.round(n * scale),
    // Width of the centred content column.
    maxWidth: size === 'tv' ? 1280 : size === 'laptop' ? 960 : 760,
    gutter: size === 'mobile' ? 16 : size === 'tablet' ? 20 : 28,
  };
}
