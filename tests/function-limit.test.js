import { describe, it, expect } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Vercel's Hobby plan deploys at most 12 serverless functions, and every
// .js file under api/ that does not start with "_" becomes one. A 13th fails
// at "Deploying outputs" with no useful log, so catch it here instead.
// Keep tests and helpers out of api/ (helpers: prefix with "_").
function functions(dir) {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return functions(p);
    return name.endsWith('.js') && !name.startsWith('_') ? [p] : [];
  });
}

describe('Vercel function limit', () => {
  it('api/ holds at most 12 functions', () => {
    expect(functions('api').length).toBeLessThanOrEqual(12);
  });
});
