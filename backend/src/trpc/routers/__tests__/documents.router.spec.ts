import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../db/index.js', () => ({ db: {} }));
vi.mock('../../../lib/clerk.js', () => ({
  authenticateRequest: async () => null,
  getOrCreateAppUser: async () => ({ id: 'u1', clerkId: 'c1', email: 't@test.com' }),
}));

// Make protectedProcedure chainable so the router module can be imported
const procedure: Record<string, unknown> = {};
procedure.query = () => procedure;
procedure.mutation = () => procedure;
procedure.input = () => procedure;
procedure.output = () => procedure;
vi.mock('../trpc.js', () => ({
  router: (r: unknown) => r,
  protectedProcedure: procedure,
}));

import { buildLineageTree } from '../documents.router.js';

const base = {
  userId: 'user-1',
  content: 'content',
  type: 'cv',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('buildLineageTree', () => {
  it('returns empty array for no rows', () => {
    expect(buildLineageTree([])).toEqual([]);
  });

  it('single root document has no children', () => {
    const rows = [{ ...base, id: 'doc-1', title: 'CV v1', parentDocumentId: null, version: 1 }];
    const tree = buildLineageTree(rows);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('doc-1');
    expect(tree[0].children).toHaveLength(0);
  });

  it('child is attached under parent', () => {
    const rows = [
      { ...base, id: 'doc-1', title: 'CV v1', parentDocumentId: null, version: 1 },
      { ...base, id: 'doc-2', title: 'CV v2', parentDocumentId: 'doc-1', version: 2 },
    ];
    const tree = buildLineageTree(rows);
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].id).toBe('doc-2');
  });

  it('orphan child (parent not in set) becomes a root', () => {
    const rows = [
      { ...base, id: 'doc-2', title: 'CV v2', parentDocumentId: 'missing-id', version: 2 },
    ];
    const tree = buildLineageTree(rows);
    expect(tree).toHaveLength(1);
    expect(tree[0].id).toBe('doc-2');
  });

  it('children are sorted by version ascending', () => {
    const rows = [
      { ...base, id: 'doc-1', title: 'CV v1', parentDocumentId: null, version: 1 },
      { ...base, id: 'doc-4', title: 'CV v4', parentDocumentId: 'doc-1', version: 4 },
      { ...base, id: 'doc-2', title: 'CV v2', parentDocumentId: 'doc-1', version: 2 },
      { ...base, id: 'doc-3', title: 'CV v3', parentDocumentId: 'doc-1', version: 3 },
    ];
    const tree = buildLineageTree(rows);
    const childVersions = tree[0].children.map((c) => c.version);
    expect(childVersions).toEqual([2, 3, 4]);
  });

  it('nested two-level tree is built correctly', () => {
    const rows = [
      { ...base, id: 'root', title: 'Root', parentDocumentId: null, version: 1 },
      { ...base, id: 'child', title: 'Child', parentDocumentId: 'root', version: 2 },
      { ...base, id: 'grandchild', title: 'Grandchild', parentDocumentId: 'child', version: 3 },
    ];
    const tree = buildLineageTree(rows);
    expect(tree[0].children[0].children[0].id).toBe('grandchild');
  });

  it('multiple independent roots are returned', () => {
    const rows = [
      { ...base, id: 'doc-a', title: 'A', parentDocumentId: null, version: 1 },
      { ...base, id: 'doc-b', title: 'B', parentDocumentId: null, version: 1 },
    ];
    const tree = buildLineageTree(rows);
    expect(tree).toHaveLength(2);
    const ids = tree.map((n) => n.id).sort();
    expect(ids).toEqual(['doc-a', 'doc-b']);
  });
});
