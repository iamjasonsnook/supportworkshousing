import { describe, it, expect } from 'vitest';
import { tableRow, buildEmailHTML } from './emailTemplate.js';

describe('tableRow', () => {
  it('produces a table row with label and value', () => {
    const html = tableRow('Name', 'Jane Doe');
    expect(html).toContain('<tr>');
    expect(html).toContain('Name');
    expect(html).toContain('Jane Doe');
  });

  it('includes a bottom border by default', () => {
    const html = tableRow('Name', 'Jane Doe');
    expect(html).toContain('border-bottom');
  });

  it('omits the bottom border when isLast is true', () => {
    const html = tableRow('Name', 'Jane Doe', true);
    expect(html).not.toContain('border-bottom');
  });
});

describe('buildEmailHTML', () => {
  it('produces valid HTML with the provided title, intro, and content', () => {
    const html = buildEmailHTML({
      title: 'Test Title',
      intro: 'Hello world',
      contentHtml: tableRow('Key', 'Value', true),
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Test Title');
    expect(html).toContain('Hello world');
    expect(html).toContain('Key');
    expect(html).toContain('Value');
  });

  it('includes the production logo URL', () => {
    const html = buildEmailHTML({ title: 'T', intro: 'I', contentHtml: '' });
    expect(html).toContain('https://supportworkshousing.org/images/logo-white.svg');
  });

  it('includes the footer with the organization link', () => {
    const html = buildEmailHTML({ title: 'T', intro: 'I', contentHtml: '' });
    expect(html).toContain('supportworkshousing.org');
  });
});
