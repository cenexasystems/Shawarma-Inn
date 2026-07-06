export const typography = {
  fonts: {
    heading: '"Bebas Neue", sans-serif',
    body: '"Inter", sans-serif',
  },
  sizes: {
    pageTitle: 'text-[56px] leading-[1.1]',
    sectionTitle: 'text-[30px] leading-[1.2]',
    cardTitle: 'text-[13px] leading-tight',
    tableHeader: 'text-[12px] leading-tight',
    body: 'text-[15px] leading-relaxed',
    button: 'text-[15px] leading-none',
    sidebar: 'text-[15px] leading-none',
  },
  weights: {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },
  tracking: {
    normal: 'tracking-normal',
    wide: 'tracking-wide',
    wider: 'tracking-wider',
    widest: 'tracking-[2px]', // Bebas Neue usually looks best with some tracking
  },
  classes: {
    // Standard combined classes for easy use
    h1: 'font-bebas text-[56px] tracking-[2px] text-gray-900 leading-none uppercase',
    h2: 'font-bebas text-[30px] tracking-[2px] text-gray-900 leading-none uppercase',
    h3: 'font-inter font-bold text-[13px] uppercase tracking-wider text-gray-500',
    tableTh: 'font-inter font-bold text-[12px] uppercase tracking-wider text-gray-400',
    bodyText: 'font-inter font-medium text-[15px] text-gray-700',
  }
};
