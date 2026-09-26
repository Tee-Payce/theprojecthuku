import { db } from './db';
import { getActiveProjectId } from './projectContext';
import { createSyncOperation, runWriteWithSync } from './syncOutbox';

/* CREATE */
export const createBatch = (batch) => {
  const projectId = getActiveProjectId();
  const result = runWriteWithSync(
    () => db.runSync(
      `INSERT INTO batches
      (projectId, name, startDate, initialChicks, chickPrice, expectedPricePerBird, expectedPricePerKg, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)` ,
      [projectId, batch.name, batch.startDate, batch.initialChicks, batch.chickPrice, batch.expectedPricePerBird, batch.expectedPricePerKg, 'active']
    ),
    insertResult => createSyncOperation({
      projectId,
      entityType: 'batch',
      entityId: insertResult.lastInsertRowId,
      action: 'create',
      payload: { ...batch, id: insertResult.lastInsertRowId, projectId, status: 'active' }
    })
  );
  return result.lastInsertRowId;
};

/* READ */
export const getAllBatches = () => {
  try {
    return db.getAllSync(`SELECT * FROM batches WHERE projectId=? ORDER BY startDate DESC`, [getActiveProjectId()]);
  } catch (error) {
    console.log('Batches table not found, returning empty array');
    return [];
  }
};

/* UPDATE */
export const updateBatchStatus = (id, status) => {
  db.runSync(`UPDATE batches SET status=? WHERE id=? AND projectId=?`, [status, id, getActiveProjectId()]);
};

/* DELETE */
export const deleteBatch = (id) => {
  db.runSync(`DELETE FROM batches WHERE id=? AND projectId=?`, [id, getActiveProjectId()]);
};

/* ADDITIONAL QUERIES */
export const getBatchById = (id) => {
  return db.getFirstSync(`SELECT * FROM batches WHERE id=? AND projectId=?`, [id, getActiveProjectId()]);
};

export const findBatchesByName = (name) => {
  return db.getAllSync(`SELECT * FROM batches WHERE projectId=? AND name LIKE ?`, [getActiveProjectId(), `%${name}%`]);
};

export const getActiveBatches = () => {
  return db.getAllSync(`SELECT * FROM batches WHERE projectId=? AND status = 'active' ORDER BY startDate DESC`, [getActiveProjectId()]);
};

export const getCompletedBatches = () => {
  return db.getAllSync(`SELECT * FROM batches WHERE projectId=? AND status = 'completed' ORDER BY startDate DESC`, [getActiveProjectId()]);
};

export const updateBatchDetails = (batch) => {
  db.runSync(
    `UPDATE batches SET name=?, startDate=?, initialChicks=?, chickPrice=?, expectedPricePerBird=?, expectedPricePerKg=? WHERE id=? AND projectId=?`,
    [batch.name, batch.startDate, batch.initialChicks, batch.chickPrice, batch.expectedPricePerBird, batch.expectedPricePerKg, batch.id, getActiveProjectId()]
  );
};

export const getBatchCount = () => {
  const result = db.getFirstSync(`SELECT COUNT(*) AS count FROM batches WHERE projectId=?`, [getActiveProjectId()]);
  return result.count;
};

export const getBatchesStartedAfter = (date) => {
  return db.getAllSync(`SELECT * FROM batches WHERE projectId=? AND startDate > ? ORDER BY startDate DESC`, [getActiveProjectId(), date]);
};

export const getBatchesByStatus = (status) => {
  return db.getAllSync(`SELECT * FROM batches WHERE projectId=? AND status = ? ORDER BY startDate DESC`, [getActiveProjectId(), status]);
};

export const getTotalInitialChicks = () => {
  const result = db.getFirstSync(`SELECT SUM(initialChicks) AS totalChicks FROM batches WHERE projectId=?`, [getActiveProjectId()]);
  return result.totalChicks || 0;
};

