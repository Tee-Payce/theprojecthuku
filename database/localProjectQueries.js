import { db } from './db';

const LEGACY_PROJECT_ID = 'legacy-local-project';

export const registerLocalProject = (project) => {
  const legacyData = db.getFirstSync(`
    SELECT (
      (SELECT COUNT(*) FROM batches WHERE projectId=?) +
      (SELECT COUNT(*) FROM feed WHERE projectId=?) +
      (SELECT COUNT(*) FROM mortality WHERE projectId=?) +
      (SELECT COUNT(*) FROM clients WHERE projectId=?) +
      (SELECT COUNT(*) FROM sales WHERE projectId=?) +
      (SELECT COUNT(*) FROM expenses WHERE projectId=?)
    ) AS total
  `, Array(6).fill(LEGACY_PROJECT_ID));
  const alreadyRegistered = db.getFirstSync(`SELECT id FROM local_projects WHERE id=?`, [project.id]);

  if (!alreadyRegistered && (legacyData?.total || 0) > 0) {
    db.execSync('BEGIN');
    try {
      for (const table of ['batches', 'feed', 'mortality', 'clients', 'sales', 'expenses']) {
        db.runSync(`UPDATE ${table} SET projectId=? WHERE projectId=?`, [project.id, LEGACY_PROJECT_ID]);
      }
      db.runSync('DELETE FROM local_projects WHERE id=?', [LEGACY_PROJECT_ID]);
      db.execSync('COMMIT');
    } catch (error) {
      db.execSync('ROLLBACK');
      throw error;
    }
  }

  db.runSync(
    `INSERT OR REPLACE INTO local_projects (id, name, role, isLegacy) VALUES (?, ?, ?, 0)`,
    [project.id, project.name, project.role]
  );
};