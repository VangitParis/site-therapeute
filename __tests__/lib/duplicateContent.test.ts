import { describe, it, expect, beforeEach, vi } from 'vitest';

// Fake Firestore client SDK: content/{docId} keyed store, backing doc()/getDoc()/setDoc().
const { store, docMock, getDocMock, setDocMock } = vi.hoisted(() => {
  const store = new Map<string, any>();
  const docMock = vi.fn((_db: any, collection: string, id: string) => ({
    path: `${collection}/${id}`,
  }));
  const getDocMock = vi.fn(async (ref: { path: string }) => ({
    exists: () => store.has(ref.path),
    data: () => store.get(ref.path),
  }));
  const setDocMock = vi.fn(async (ref: { path: string }, data: any) => {
    store.set(ref.path, data);
  });
  return { store, docMock, getDocMock, setDocMock };
});

vi.mock('firebase/firestore', () => ({
  doc: docMock,
  getDoc: getDocMock,
  setDoc: setDocMock,
}));

vi.mock('../../lib/firebaseClient', () => ({ db: {} }));

import { duplicateContentForUser } from '../../lib/duplicateContent';

const DEFAULT_FR_CONTENT = {
  layout: { nom: 'Marie Dupont', titre: 'Sophrologue', footer: '© Marie', liens: [] },
  accueil: { titre: 'Bienvenue', texte: 'Salut', image: 'https://img/marie.jpg' },
  contact: { titre: 'Contact', lien: 'mailto:marie@example.com' },
};

describe('duplicateContentForUser (isolation between tenants at signup)', () => {
  beforeEach(() => {
    store.clear();
    store.set('content/fr', JSON.parse(JSON.stringify(DEFAULT_FR_CONTENT)));
    docMock.mockClear();
    getDocMock.mockClear();
    setDocMock.mockClear();
  });

  it('creates an independent content/{uid} document for a brand-new client', async () => {
    await duplicateContentForUser('uid-A', 'sophrologie', {
      displayName: 'Client A',
      email: 'a@example.com',
    });

    expect(store.has('content/uid-A')).toBe(true);
    const savedForA = store.get('content/uid-A');
    expect(savedForA.layout.nom).toBe('Client A');
    expect(savedForA.contact.lien).toBe('mailto:a@example.com');
  });

  it('never mutates content/fr (the shared template) while duplicating it', async () => {
    await duplicateContentForUser('uid-A', 'sophrologie', { displayName: 'Client A' });
    expect(store.get('content/fr')).toEqual(DEFAULT_FR_CONTENT);
  });

  it('gives two different clients two independent copies, not shared references', async () => {
    await duplicateContentForUser('uid-A', 'sophrologie', { displayName: 'Client A' });
    await duplicateContentForUser('uid-B', 'sophrologie', { displayName: 'Client B' });

    const savedForA = store.get('content/uid-A');
    const savedForB = store.get('content/uid-B');

    expect(savedForA.layout.nom).toBe('Client A');
    expect(savedForB.layout.nom).toBe('Client B');
    expect(savedForA).not.toBe(savedForB); // distinct objects, not aliased

    // Mutating one client's in-memory copy must never leak into the other's.
    savedForA.layout.nom = 'Tampered';
    expect(savedForB.layout.nom).toBe('Client B');
  });

  it('does not overwrite an existing content/{uid} document (no accidental reset)', async () => {
    store.set('content/uid-A', { layout: { nom: 'Already customized' } });
    setDocMock.mockClear();

    await duplicateContentForUser('uid-A', 'sophrologie', { displayName: 'Should not apply' });

    expect(setDocMock).not.toHaveBeenCalled();
    expect(store.get('content/uid-A')).toEqual({ layout: { nom: 'Already customized' } });
  });

  it('only ever writes to content/{uid} — never touches another uid or content/fr', async () => {
    await duplicateContentForUser('uid-A', 'sophrologie', { displayName: 'Client A' });

    expect(setDocMock).toHaveBeenCalledTimes(1);
    const [ref] = setDocMock.mock.calls[0];
    expect(ref.path).toBe('content/uid-A');
  });
});
