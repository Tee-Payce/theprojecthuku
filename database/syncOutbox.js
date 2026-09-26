import { db } from './db';
import { getActiveProjectId } from './projectContext';

const createOperationId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const createSyncOperation = ({ projectId = getActiveProjectId(), entityType, entityId, action, payload }) => ({
  operationId: createOperationId(),
  projectId,
  entityType,
  entityId: String(entityId),
  action,
  payloadJson: JSON.stringify(payload),
  createdAt: new Date().toISOString()
});

export const enqueueSyncOperation = (operation) => {
  db.runSync(
    `INSERT INTO sync_outbox
      (operationId, projectId, entityType, entityId, action, payloadJson, createdAt, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [operation.operationId, operation.projectId, operation.entityType, operation.entityId, operation.action, operation.payloadJson, operation.createdAt]
  );
  db.runSync(
    `INSERT OR IGNORE INTO sync_state (projectId, status) VALUES (?, 'pending')`,
    [operation.projectId]
  );
};

export const runWriteWithSync = (write, operation) => {
  let result;
  db.withTransactionSync(() => {
    result = write();
    enqueueSyncOperation(typeof operation === 'function' ? operation(result) : operation);
  });
  return result;
};

export const getPendingSyncOperations = (projectId = getActiveProjectId(), limit = 50) => db.getAllSync(
  `SELECT * FROM sync_outbox WHERE projectId=? AND status IN ('pending', 'failed') ORDER BY createdAt LIMIT ?`,
  [projectId, limit]
);

export const markOperationsProcessing = (operationIds) => {
  const now = new Date().toISOString();
  for (const operationId of operationIds) {
    db.runSync(
      `UPDATE sync_outbox SET status='processing', attempts=attempts+1, lastAttemptAt=?, lastError=NULL WHERE operationId=?`,
      [now, operationId]
    );
  }
};

export const markOperationsCompleted = (operationIds, projectId) => {
  for (const operationId of operationIds) {
    db.runSync(`UPDATE sync_outbox SET status='completed' WHERE operationId=?`, [operationId]);
  }
  db.runSync(
    `INSERT INTO sync_state (projectId, status, lastSuccessfulSync, lastError)
     VALUES (?, 'synced', ?, NULL)
     ON CONFLICT(projectId) DO UPDATE SET status='synced', lastSuccessfulSync=excluded.lastSuccessfulSync, lastError=NULL`,
    [projectId, new Date().toISOString()]
  );
};

export const markOperationsFailed = (operationIds, error, projectId) => {
  for (const operationId of operationIds) {
    db.runSync(`UPDATE sync_outbox SET status='failed', lastError=? WHERE operationId=?`, [error, operationId]);
  }
  db.runSync(
    `INSERT INTO sync_state (projectId, status, lastError) VALUES (?, 'error', ?)
     ON CONFLICT(projectId) DO UPDATE SET status='error', lastError=excluded.lastError`,
    [projectId, error]
  );
};

export const getSyncStatus = (projectId = getActiveProjectId()) => {
  const state = db.getFirstSync(`SELECT * FROM sync_state WHERE projectId=?`, [projectId]);
  const pending = db.getFirstSync(
    `SELECT COUNT(*) AS count FROM sync_outbox WHERE projectId=? AND status IN ('pending', 'processing', 'failed')`,
    [projectId]
  );
  return { ...(state || { status: 'synced', lastError: null }), pendingCount: pending?.count || 0 };
};

// ── Cursor management ──────────────────────────────────────────────────────
// lastServerCursor is stored in sync_state and advanced only after a
// successful local application of downloaded operations.

export const getServerCursor = (projectId = getActiveProjectId()) => {
  const row = db.getFirstSync(
    `SELECT lastServerCursor FROM sync_state WHERE projectId=?`,
    [projectId]
  );
  return row?.lastServerCursor ?? 0;
};

export const advanceServerCursor = (projectId, newCursor) => {
  db.runSync(
    `INSERT INTO sync_state (projectId, lastServerCursor, status)
     VALUES (?, ?, 'synced')
     ON CONFLICT(projectId) DO UPDATE SET
       lastServerCursor = excluded.lastServerCursor,
       lastSuccessfulSync = ?,
       status = CASE WHEN status = 'error' THEN 'error' ELSE 'synced' END`,
    [projectId, newCursor, new Date().toISOString()]
  );
};

// Mark an operation as already applied locally (idempotency guard for download).
export const markOperationApplied = (operationId, projectId) => {
  db.runSync(
    `INSERT OR IGNORE INTO sync_applied_operations (operationId, projectId, appliedAt)
     VALUES (?, ?, ?)`,
    [operationId, projectId, new Date().toISOString()]
  );
};

export const isOperationApplied = (operationId) => {
  const row = db.getFirstSync(
    `SELECT 1 FROM sync_applied_operations WHERE operationId=?`,
    [operationId]
  );
  return !!row;
};