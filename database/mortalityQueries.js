import { db } from './db';
import { getActiveProjectId } from './projectContext';
import { createSyncOperation, runWriteWithSync } from './syncOutbox';

export const recordMortality = (data) => {
  const projectId = getActiveProjectId();
  return runWriteWithSync(
    () => db.runSync(
      `INSERT INTO mortality (projectId, batchId, quantity, date, reason) VALUES (?, ?, ?, ?, ?)`,
      [projectId, data.batchId, data.quantity, data.date, data.reason]
    ),
    result => createSyncOperation({ projectId, entityType: 'mortality', entityId: result.lastInsertRowId, action: 'create', payload: { ...data, id: result.lastInsertRowId, projectId } })
  );
};

export const getMortalityByBatch = (batchId) => {
  const result = db.getFirstSync(
    `SELECT SUM(quantity) as totalDead FROM mortality WHERE projectId=? AND batchId=?`,
    [getActiveProjectId(), batchId]
  );
  return result?.totalDead || 0;
};
