import { createFakeFirestore, FakeFirestoreData } from './fake-firestore';

describe('createFakeFirestore', () => {
  let db: ReturnType<typeof createFakeFirestore>;

  beforeEach(() => {
    db = createFakeFirestore();
  });

  describe('collection().doc().set() / get()', () => {
    it('stores and retrieves a document by id', async () => {
      const coll = db.collection('items');
      await coll.doc('d1').set({ name: 'Widget', price: 10 });
      const snap = await coll.doc('d1').get();

      expect(snap.exists).toBe(true);
      expect(snap.id).toBe('d1');
      expect(snap.data()).toEqual({ name: 'Widget', price: 10, id: 'd1' });
    });

    it('returns exists=false for a missing document', async () => {
      const snap = await db.collection('items').doc('missing').get();
      expect(snap.exists).toBe(false);
      expect(snap.id).toBe('missing');
    });
  });

  describe('collection().add()', () => {
    it('auto-generates an id and stores the document', async () => {
      const ref = await db.collection('items').add({ name: 'Gadget' });
      expect(ref.id).toBeTruthy();

      const snap = await db.collection('items').doc(ref.id).get();
      expect(snap.exists).toBe(true);
      expect(snap.data()).toEqual({ name: 'Gadget', id: ref.id });
    });
  });

  describe('collection().doc().update()', () => {
    it('merges new fields into an existing document', async () => {
      const coll = db.collection('items');
      await coll.doc('d1').set({ name: 'Widget', price: 10 });
      await coll.doc('d1').update({ price: 20 });

      const snap = await coll.doc('d1').get();
      expect(snap.data()).toEqual({ name: 'Widget', price: 20, id: 'd1' });
    });
  });

  describe('collection().doc().delete()', () => {
    it('removes the document', async () => {
      const coll = db.collection('items');
      await coll.doc('d1').set({ name: 'Widget' });
      await coll.doc('d1').delete();

      const snap = await coll.doc('d1').get();
      expect(snap.exists).toBe(false);
    });
  });

  describe('where()', () => {
    it('filters documents by == operator', async () => {
      const coll = db.collection('items');
      await coll.doc('d1').set({ name: 'Widget', color: 'red' });
      await coll.doc('d2').set({ name: 'Gadget', color: 'blue' });
      await coll.doc('d3').set({ name: 'Thing', color: 'red' });

      const snap = await coll.where('color', '==', 'red').get();
      expect(snap.size).toBe(2);
      expect(snap.docs.map((d) => d.id).sort()).toEqual(['d1', 'd3']);
    });

    it('returns empty results when nothing matches', async () => {
      const coll = db.collection('items');
      await coll.doc('d1').set({ name: 'Widget' });

      const snap = await coll.where('name', '==', 'Nonexistent').get();
      expect(snap.size).toBe(0);
      expect(snap.docs).toHaveLength(0);
    });
  });

  describe('orderBy()', () => {
    it('sorts documents ascending by a field', async () => {
      const coll = db.collection('items');
      await coll.doc('d1').set({ name: 'Charlie', order: 3 });
      await coll.doc('d2').set({ name: 'Alpha', order: 1 });
      await coll.doc('d3').set({ name: 'Bravo', order: 2 });

      const snap = await coll.orderBy('order', 'asc').get();
      expect(snap.docs.map((d) => (d.data() as FakeFirestoreData).name)).toEqual(['Alpha', 'Bravo', 'Charlie']);
    });

    it('sorts documents descending by a field', async () => {
      const coll = db.collection('items');
      await coll.doc('d1').set({ name: 'Charlie', order: 3 });
      await coll.doc('d2').set({ name: 'Alpha', order: 1 });
      await coll.doc('d3').set({ name: 'Bravo', order: 2 });

      const snap = await coll.orderBy('order', 'desc').get();
      expect(snap.docs.map((d) => (d.data() as FakeFirestoreData).name)).toEqual(['Charlie', 'Bravo', 'Alpha']);
    });
  });

  describe('select()', () => {
    it('returns only the selected fields', async () => {
      const coll = db.collection('items');
      await coll.doc('d1').set({ name: 'Widget', price: 10, color: 'red' });

      const snap = await coll.select('name', 'price').get();
      expect(snap.docs[0].data()).toEqual({ name: 'Widget', price: 10 });
    });
  });

  describe('offset() and limit()', () => {
    it('returns a paginated slice of documents', async () => {
      const coll = db.collection('items');
      await coll.doc('d1').set({ order: 1 });
      await coll.doc('d2').set({ order: 2 });
      await coll.doc('d3').set({ order: 3 });
      await coll.doc('d4').set({ order: 4 });
      await coll.doc('d5').set({ order: 5 });

      const snap = await coll.orderBy('order', 'asc').offset(2).limit(2).get();
      expect(snap.size).toBe(2);
      expect(snap.docs.map((d) => d.id)).toEqual(['d3', 'd4']);
    });
  });

  describe('count()', () => {
    it('returns the total count of documents in a collection', async () => {
      const coll = db.collection('items');
      await coll.doc('d1').set({ name: 'A' });
      await coll.doc('d2').set({ name: 'B' });
      await coll.doc('d3').set({ name: 'C' });

      const snap = await coll.count().get();
      expect(snap.data().count).toBe(3);
    });

    it('returns 0 for an empty collection', async () => {
      const snap = await db.collection('empty').count().get();
      expect(snap.data().count).toBe(0);
    });
  });

  describe('seedData initialization', () => {
    it('pre-populates collections from seed data', () => {
      const seeded = createFakeFirestore({
        items: [
          { id: 's1', name: 'Seeded A' },
          { id: 's2', name: 'Seeded B' },
        ],
      });

      return seeded.collection('items').get().then((snap) => {
        expect(snap.size).toBe(2);
        expect(snap.docs.map((d) => d.id).sort()).toEqual(['s1', 's2']);
      });
    });
  });

  describe('chainable query builder', () => {
    it('supports chaining where + orderBy + limit', async () => {
      const coll = db.collection('items');
      await coll.doc('d1').set({ color: 'red', order: 3 });
      await coll.doc('d2').set({ color: 'blue', order: 1 });
      await coll.doc('d3').set({ color: 'red', order: 2 });
      await coll.doc('d4').set({ color: 'red', order: 4 });

      const snap = await coll.where('color', '==', 'red').orderBy('order', 'asc').limit(2).get();
      expect(snap.size).toBe(2);
      expect(snap.docs.map((d) => d.id)).toEqual(['d3', 'd1']);
    });
  });

  describe('listCollections', () => {
    it('returns the seeded collection names', async () => {
      const seeded = createFakeFirestore({
        items: [{ id: 'i1', name: 'A' }],
        other: [{ id: 'o1', name: 'B' }],
      });
      const collections = await seeded.listCollections();
      expect(collections.map((c) => c.id).sort()).toEqual(['items', 'other']);
    });
  });
});
