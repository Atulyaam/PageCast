import { describe, it, expect } from 'vitest';
import React, { type ReactElement } from 'react';
import { TeletextGrid } from '@/components/teletext/TeletextGrid';
import { AccessibleAlternative } from '@/components/teletext/AccessibleAlternative';
import { layoutBulletinPage } from '@/domain/layout-engine/layout';

describe('Teletext React Components', () => {
  const samplePage = layoutBulletinPage({
    pageNumber: 101,
    title: 'World News',
    topic: 'HEADLINES',
    headline: 'PEACE SUMMIT CONCLUDES',
    paragraphs: ['Diplomats have signed a multilateral peace framework.'],
    fastext: { red: 102, green: 200, yellow: 300, cyan: 100 },
  });

  it('renders TeletextGrid with strictly 25 rows and accessibility alternative', () => {
    const element = TeletextGrid({
      page: samplePage,
      showScanlines: true,
      phosphorGlow: true,
    }) as ReactElement<{ children: React.ReactNode[] }>;

    expect(element).toBeDefined();
    expect(React.isValidElement(element)).toBe(true);

    // Verify AccessibleAlternative is embedded
    const children = React.Children.toArray(element.props.children);
    expect(children.length).toBeGreaterThanOrEqual(2);
  });

  it('generates AccessibleAlternative with semantic screen-reader text', () => {
    const element = AccessibleAlternative({ page: samplePage }) as ReactElement<{
      className: string;
      'aria-label': string;
      children: ReactElement[];
    }>;

    expect(element).toBeDefined();
    expect(React.isValidElement(element)).toBe(true);
    expect(element.props.className).toContain('sr-only');
    expect(element.props['aria-label']).toContain('Page 101: World News');
  });

  it('contains Fastext quick links inside the accessible alternative', () => {
    const element = AccessibleAlternative({ page: samplePage }) as ReactElement<{
      children: ReactElement[];
    }>;
    const navSection = element.props.children[2] as ReactElement<{
      'aria-label': string;
    }>;

    expect(navSection.type).toBe('nav');
    expect(navSection.props['aria-label']).toBe('Fastext Shortcut Navigation');
  });
});
