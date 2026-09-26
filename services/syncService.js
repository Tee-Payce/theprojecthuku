import { applyDownloadedOperation } from '@/database/applyOperation';
import { db } from '@/database/db';
import { getActiveProjectId } from '@/database/projectContext';
import {
    advanceServerCursor,
    getPendingSyncOperations,
    getServerCursor,
    isOperationApplied,
    markOperationApplied,
    markOperationsCompleted,
    markOperationsFailed,
    markOperationsProcessing,
} from '@/database/syncOutbox';
import { supabase } from './supabase';

// ── Upload ─────────────────────────────────────────────────────────────────

const parseOperation = (row) => ({
  operationId: row.operationId,
  projectId:   row.projectId,
  entityType:  row.entityType,
  entityId:    row.entityId,
  action:      row.action,
  payload:     JSON.parse(row.payloadJson),
  createdAt:   row.createdAt,
});

/**
 * Upload pending outbox entries for a project to Supabase.
 * Returns { uploaded, failed }.
 */
const uploadProject = async (projectId) => {
  const pendingRows = getPendingSyncOperations(projectId);
  if (pendingRows.length === 0) return { uploaded: 0, failed: 0 };

  const operationIds = pendingRows.map((op) => op.operationId);
  markOperationsProcessing(operationIds);

  try {
    const { data, error } = await supabase.rpc('upload_sync_operations', {
      operations: pendingRows.map(parseOperation),
    });
    if (error) throw error;

    const results   = data || [];
    const completed = results.filter((r) => r.accepted).map((r) => r.operation_id);
    const rejected  = results.filter((r) => !r.accepted);

    if (completed.length > 0) markOperationsCompleted(completed, projectId);
    if (rejected.length > 0) {
      markOperationsFailed(
        rejected.map((r) => r.operation_id),
        rejected.map((r) => r.error_message || 'Operation rejected').join('; '),
        projectId
      );
    }

    return { uploaded: completed.length, failed: rejected.length };
  } catch (err) {
    markOperationsFailed(operationIds, err.message || 'Sync failed', projectId);
    throw err;
  }
};

// ── Download ───────────────────────────────────────────────────────────────

const DOWNLOAD_BATCH_SIZE = 100;

/**
 * Download operations from Supabase that arrived after our last known
 * server cursor and apply them to local SQLite.
 *
 * Flow per batch:
 *   1. Fetch up to DOWNLOAD_BATCH_SIZE rows after lastCursor.
 *   2. For each row, skip if already in sync_applied_operations.
 *   3. Apply to local SQLite inside a transaction.
 *   4. Mark as applied and advance the cursor — only after the
 *      transaction commits.  Cursor is never advanced on failure.
 *   5. Repeat until the server returns fewer rows than the batch size
 *      (no more pages).
 *
 * Returns { applied, skipped, pages }.
 */
const downloadProject = async (projectId) => {
  let cursor  = getServerCursor(projectId);
  let applied = 0;
  let skipped = 0;
  let pages   = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: rows, error } = await supabase.rpc('download_sync_operations', {
      target_project_id: projectId,
      after_cursor:      cursor,
      batch_size:        DOWNLOAD_BATCH_SIZE,
    });

    if (error) throw error;
    if (!rows || rows.length === 0) break;

    pages += 1;

    for (const row of rows) {
      const operationId = row.operation_id;

      // Already applied on a previous sync — skip and advance cursor only.
      if (isOperationApplied(operationId)) {
        skipped += 1;
        if (row.server_cursor > cursor) {
          advanceServerCursor(projectId, row.server_cursor);
          cursor = row.server_cursor;
        }
        continue;
      }

      // Apply inside a transaction so the apply + mark + cursor advance
      // are atomic.  If anything throws, the transaction rolls back and the
      // cursor is NOT advanced, so we will retry this operation next sync.
      try {
        db.withTransactionSync(() => {
          applyDownloadedOperation(row, projectId);
          markOperationApplied(operationId, projectId);
          advanceServerCursor(projectId, row.server_cursor);
        });
        cursor  = row.server_cursor;
        applied += 1;
      } catch (applyErr) {
        // Log but do not rethrow — a single bad row should not block the
        // rest of the batch.  The cursor stops advancing past this row,
        // so it will be retried on the next sync.
        console.error(
          `[syncService] failed to apply operation ${operationId}:`,
          applyErr
        );
        // Stop processing this page; retry from this cursor next time.
        break;
      }
    }

    // If the server returned fewer rows than the batch size there are no
    // more pages to fetch.
    if (rows.length < DOWNLOAD_BATCH_SIZE) break;
  }

  return { applied, skipped, pages };
};

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Run a full upload-then-download sync cycle for a project.
 *
 * Upload first so the server has this device's latest operations before
 * we fetch; this ensures the download includes the server_cursor values
 * assigned to our own just-uploaded operations and we won't re-apply them.
 *
 * Returns { uploaded, uploadFailed, applied, skipped, pages }.
 */
export const syncProject = async (projectId = getActiveProjectId()) => {
  let uploadResult   = { uploaded: 0, failed: 0 };
  let downloadResult = { applied: 0, skipped: 0, pages: 0 };

  // Upload (failures throw; caller handles in AppContext.syncNow)
  uploadResult = await uploadProject(projectId);

  // Download (independent of upload success — always attempt)
  try {
    downloadResult = await downloadProject(projectId);
  } catch (downloadErr) {
    // Download errors are non-fatal for the upload result.
    console.error('[syncService] download error:', downloadErr);
  }

  return {
    uploaded:     uploadResult.uploaded,
    uploadFailed: uploadResult.failed,
    applied:      downloadResult.applied,
    skipped:      downloadResult.skipped,
    pages:        downloadResult.pages,
  };
};
