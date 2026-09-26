/**
 * applyOperation.js
 *
 * Applies a single downloaded sync operation to local SQLite.
 * Called by syncService.downloadProject() for each row returned by the
 * download_sync_operations Supabase RPC.
 *
 * Design rules:
 *  1. Every apply is wrapped in a transaction by the caller; this module
 *     only performs the SQLite writes.
 *  2. Operations from the *current device* are already in local SQLite, so
 *     we use INSERT OR IGNORE / UPDATE OR IGNORE to avoid duplicating them.
 *  3. Entity IDs arriving from the server are UUIDs (strings). Local SQLite
 *     tables use TEXT primary keys for downloaded records. The existing
 *     INTEGER AUTOINCREMENT rows created locally are different rows — they
 *     carry the same data but with local integer IDs. Phase 5 only applies
 *     records created *by other devices*; own-device records already exist
 *     locally with their integer IDs.
 *  4. Soft deletes set a deleted_at column (added below if missing). The
 *     local query layer already filters by projectId; deleted rows will
 *     naturally be excluded once query-layer soft-delete filtering is added
 *     in a later phase.
 *  5. Batch/client foreign keys use the server UUID as a text reference in
 *     the synced* columns; local integer batchId / clientId columns are
 *     left NULL for records that arrived via download so existing local
 *     query joins still work for locally-created data.
 *
 * Entity-to-table mapping:
 *   batch     → batches
 *   feed      → feed
 *   mortality → mortality
 *   client    → clients
 *   sale      → sales
 *   expense   → expenses
 */

import { db } from './db';

// ── Column guards ──────────────────────────────────────────────────────────
// Some columns used for downloaded records may not exist yet in older
// installs. We add them idempotently once per session.

let _columnsEnsured = false;

const ensureDownloadColumns = () => {
  if (_columnsEnsured) return;

  const addIfMissing = (table, column, def) => {
    const cols = db.getAllSync(`PRAGMA table_info(${table})`);
    if (!cols.some(c => c.name === column)) {
      db.execSync(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
    }
  };

  // Stable UUID-based identity for downloaded records
  addIfMissing('batches',   'serverId',   'TEXT');
  addIfMissing('feed',      'serverId',   'TEXT');
  addIfMissing('mortality', 'serverId',   'TEXT');
  addIfMissing('clients',   'serverId',   'TEXT');
  addIfMissing('sales',     'serverId',   'TEXT');
  addIfMissing('expenses',  'serverId',   'TEXT');

  // Soft-delete tombstone
  addIfMissing('batches',   'deletedAt',  'TEXT');
  addIfMissing('feed',      'deletedAt',  'TEXT');
  addIfMissing('mortality', 'deletedAt',  'TEXT');
  addIfMissing('clients',   'deletedAt',  'TEXT');
  addIfMissing('sales',     'deletedAt',  'TEXT');
  addIfMissing('expenses',  'deletedAt',  'TEXT');

  // Server version for optimistic-concurrency on update
  addIfMissing('batches',   'serverVersion', 'INTEGER NOT NULL DEFAULT 0');
  addIfMissing('clients',   'serverVersion', 'INTEGER NOT NULL DEFAULT 0');

  // Cross-reference to server batch/client UUID for batch-owned entities
  addIfMissing('feed',      'serverBatchId',  'TEXT');
  addIfMissing('mortality', 'serverBatchId',  'TEXT');
  addIfMissing('sales',     'serverBatchId',  'TEXT');
  addIfMissing('sales',     'serverClientId', 'TEXT');
  addIfMissing('expenses',  'serverBatchId',  'TEXT');

  _columnsEnsured = true;
};

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Find the local integer row id for a given serverId in a table.
 * Returns null if not found locally (the referenced entity hasn't arrived
 * yet or was created on another device).
 */
const localIdForServerId = (table, serverId) => {
  if (!serverId) return null;
  const row = db.getFirstSync(
    `SELECT id FROM ${table} WHERE serverId = ?`,
    [serverId]
  );
  return row?.id ?? null;
};

// ── Main dispatcher ────────────────────────────────────────────────────────

/**
 * Apply one downloaded operation to the local SQLite database.
 *
 * @param {object} operation - Row from download_sync_operations RPC:
 *   { operation_id, entity_type, entity_id, action, payload, server_cursor }
 * @param {string} projectId - The active project UUID.
 *
 * The caller is responsible for:
 *   - Checking isOperationApplied() before calling this function.
 *   - Wrapping the call in db.withTransactionSync().
 *   - Calling markOperationApplied() and advanceServerCursor() after success.
 */
export const applyDownloadedOperation = (operation, projectId) => {
  ensureDownloadColumns();

  const { entity_type, entity_id, action, payload, server_cursor } = operation;

  switch (entity_type) {

    // ── batch ──────────────────────────────────────────────────────────────
    case 'batch': {
      if (action === 'create') {
        db.runSync(
          `INSERT OR IGNORE INTO batches
             (projectId, serverId, name, startDate, initialChicks, chickPrice,
              expectedPricePerBird, expectedPricePerKg, status, serverVersion)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            projectId,
            entity_id,
            payload.name ?? null,
            payload.startDate ?? null,
            payload.initialChicks ?? null,
            payload.chickPrice ?? null,
            payload.expectedPricePerBird ?? null,
            payload.expectedPricePerKg ?? null,
            payload.status ?? 'active',
            server_cursor,
          ]
        );
      } else if (action === 'update') {
        // Only apply if the incoming server_version is newer than what we have.
        db.runSync(
          `UPDATE batches SET
             name                  = COALESCE(?, name),
             startDate             = COALESCE(?, startDate),
             initialChicks         = COALESCE(?, initialChicks),
             chickPrice            = COALESCE(?, chickPrice),
             expectedPricePerBird  = COALESCE(?, expectedPricePerBird),
             expectedPricePerKg    = COALESCE(?, expectedPricePerKg),
             status                = COALESCE(?, status),
             serverVersion         = ?
           WHERE serverId = ? AND projectId = ? AND serverVersion < ?`,
          [
            payload.name ?? null,
            payload.startDate ?? null,
            payload.initialChicks ?? null,
            payload.chickPrice ?? null,
            payload.expectedPricePerBird ?? null,
            payload.expectedPricePerKg ?? null,
            payload.status ?? null,
            server_cursor,
            entity_id,
            projectId,
            server_cursor,
          ]
        );
      } else if (action === 'delete') {
        db.runSync(
          `UPDATE batches SET deletedAt = datetime('now'), serverVersion = ?
           WHERE serverId = ? AND projectId = ? AND deletedAt IS NULL`,
          [server_cursor, entity_id, projectId]
        );
      }
      break;
    }

    // ── feed ───────────────────────────────────────────────────────────────
    case 'feed': {
      if (action === 'create') {
        const localBatchId = localIdForServerId('batches', payload.batchId);
        db.runSync(
          `INSERT OR IGNORE INTO feed
             (projectId, serverId, batchId, serverBatchId,
              type, quantityKg, pricePerKg, datePurchased, receiptPath)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            projectId,
            entity_id,
            localBatchId,
            payload.batchId ?? null,
            payload.type ?? null,
            payload.quantityKg ?? null,
            payload.pricePerKg ?? null,
            payload.datePurchased ?? null,
            payload.receiptPath ?? null,
          ]
        );
      } else if (action === 'delete') {
        db.runSync(
          `UPDATE feed SET deletedAt = datetime('now')
           WHERE serverId = ? AND projectId = ? AND deletedAt IS NULL`,
          [entity_id, projectId]
        );
      }
      break;
    }

    // ── mortality ──────────────────────────────────────────────────────────
    case 'mortality': {
      if (action === 'create') {
        const localBatchId = localIdForServerId('batches', payload.batchId);
        db.runSync(
          `INSERT OR IGNORE INTO mortality
             (projectId, serverId, batchId, serverBatchId,
              quantity, date, reason)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            projectId,
            entity_id,
            localBatchId,
            payload.batchId ?? null,
            payload.quantity ?? null,
            payload.date ?? null,
            payload.reason ?? null,
          ]
        );
      } else if (action === 'delete') {
        db.runSync(
          `UPDATE mortality SET deletedAt = datetime('now')
           WHERE serverId = ? AND projectId = ? AND deletedAt IS NULL`,
          [entity_id, projectId]
        );
      }
      break;
    }

    // ── client ─────────────────────────────────────────────────────────────
    case 'client': {
      if (action === 'create') {
        db.runSync(
          `INSERT OR IGNORE INTO clients
             (projectId, serverId, name, phone, serverVersion)
           VALUES (?, ?, ?, ?, ?)`,
          [
            projectId,
            entity_id,
            payload.name ?? null,
            payload.phone ?? null,
            server_cursor,
          ]
        );
      } else if (action === 'update') {
        db.runSync(
          `UPDATE clients SET
             name          = COALESCE(?, name),
             phone         = COALESCE(?, phone),
             serverVersion = ?
           WHERE serverId = ? AND projectId = ? AND serverVersion < ?`,
          [
            payload.name ?? null,
            payload.phone ?? null,
            server_cursor,
            entity_id,
            projectId,
            server_cursor,
          ]
        );
      } else if (action === 'delete') {
        db.runSync(
          `UPDATE clients SET deletedAt = datetime('now'), serverVersion = ?
           WHERE serverId = ? AND projectId = ? AND deletedAt IS NULL`,
          [server_cursor, entity_id, projectId]
        );
      }
      break;
    }

    // ── sale ───────────────────────────────────────────────────────────────
    case 'sale': {
      if (action === 'create') {
        const localBatchId  = localIdForServerId('batches',  payload.batchId);
        const localClientId = localIdForServerId('clients',  payload.clientId);
        db.runSync(
          `INSERT OR IGNORE INTO sales
             (projectId, serverId, batchId, clientId,
              serverBatchId, serverClientId,
              saleType, quantity, price, total, date, receiptPath)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            projectId,
            entity_id,
            localBatchId,
            localClientId,
            payload.batchId  ?? null,
            payload.clientId ?? null,
            payload.saleType ?? null,
            payload.quantity ?? null,
            payload.price    ?? null,
            payload.total    ?? null,
            payload.date     ?? null,
            payload.receiptPath ?? null,
          ]
        );
      } else if (action === 'delete') {
        db.runSync(
          `UPDATE sales SET deletedAt = datetime('now')
           WHERE serverId = ? AND projectId = ? AND deletedAt IS NULL`,
          [entity_id, projectId]
        );
      }
      break;
    }

    // ── expense ────────────────────────────────────────────────────────────
    case 'expense': {
      if (action === 'create') {
        const localBatchId = localIdForServerId('batches', payload.batchId);
        db.runSync(
          `INSERT OR IGNORE INTO expenses
             (projectId, serverId, batchId, serverBatchId,
              itemName, category, amount, date, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            projectId,
            entity_id,
            localBatchId,
            payload.batchId ?? null,
            payload.itemName  ?? '',
            payload.category  ?? '',
            payload.amount    ?? 0,
            payload.date      ?? '',
            payload.notes     ?? null,
          ]
        );
      } else if (action === 'delete') {
        db.runSync(
          `UPDATE expenses SET deletedAt = datetime('now')
           WHERE serverId = ? AND projectId = ? AND deletedAt IS NULL`,
          [entity_id, projectId]
        );
      }
      break;
    }

    default:
      // Unknown entity type — log but do not throw so the cursor still advances.
      console.warn(`[applyOperation] unknown entity type: ${entity_type}`);
      break;
  }
};
