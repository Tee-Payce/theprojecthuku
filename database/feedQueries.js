import { db } from './db';
import { getActiveProjectId } from './projectContext';
import { createSyncOperation, runWriteWithSync } from './syncOutbox';

export const addFeedExpense = (feed) => {
  const projectId = getActiveProjectId();
  return runWriteWithSync(
    () => db.runSync(
      `INSERT INTO feed (projectId, batchId, type, quantityKg, pricePerKg, datePurchased, receiptPath)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [projectId, feed.batchId, feed.type, feed.quantityKg, feed.pricePerKg, feed.datePurchased, feed.receiptPath]
    ),
    result => createSyncOperation({ projectId, entityType: 'feed', entityId: result.lastInsertRowId, action: 'create', payload: { ...feed, id: result.lastInsertRowId, projectId } })
  );
};

export const getFeedByBatch = (batchId) => {
  return db.getAllSync(`SELECT * FROM feed WHERE projectId=? AND batchId=?`, [getActiveProjectId(), batchId]);
};
