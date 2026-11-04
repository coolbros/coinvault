import { getDatabase } from '../client';
import { Tag } from '../schema';

export const tagRepository = {
  listAll(): Tag[] {
    const db = getDatabase();
    return db.getAllSync<Tag>('SELECT * FROM tags ORDER BY name ASC;');
  },

  getById(id: string): Tag | null {
    const db = getDatabase();
    return db.getFirstSync<Tag>('SELECT * FROM tags WHERE id = ?;', [id]);
  },

  create(name: string, color: string): Tag {
    const db = getDatabase();
    const id = `tag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    db.runSync('INSERT INTO tags (id, name, color) VALUES (?, ?, ?);', [id, name, color]);
    return { id, name, color };
  },

  findByName(name: string): Tag | null {
    const db = getDatabase();
    return db.getFirstSync<Tag>('SELECT * FROM tags WHERE LOWER(name) = LOWER(?);', [name]);
  },

  assignToSpecimen(specimenId: string, tagId: string): void {
    const db = getDatabase();
    db.runSync(
      'INSERT OR IGNORE INTO specimen_tags (specimen_id, tag_id) VALUES (?, ?);',
      [specimenId, tagId]
    );
  },

  removeFromSpecimen(specimenId: string, tagId: string): void {
    const db = getDatabase();
    db.runSync(
      'DELETE FROM specimen_tags WHERE specimen_id = ? AND tag_id = ?;',
      [specimenId, tagId]
    );
  },

  setSpecimenTags(specimenId: string, tagIds: string[]): void {
    const db = getDatabase();
    db.withTransactionSync(() => {
      db.runSync('DELETE FROM specimen_tags WHERE specimen_id = ?;', [specimenId]);
      const stmt = db.prepareSync('INSERT INTO specimen_tags (specimen_id, tag_id) VALUES (?, ?);');
      for (const tagId of tagIds) {
        stmt.executeSync([specimenId, tagId]);
      }
      stmt.finalizeSync();
    });
  },

  getTagsForSpecimen(specimenId: string): Tag[] {
    const db = getDatabase();
    return db.getAllSync<Tag>(
      `SELECT t.* FROM tags t
       JOIN specimen_tags st ON t.id = st.tag_id
       WHERE st.specimen_id = ?
       ORDER BY t.name ASC;`,
      [specimenId]
    );
  }
};
