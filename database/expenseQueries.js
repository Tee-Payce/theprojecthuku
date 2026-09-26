import { db } from './db';
import { getActiveProjectId } from './projectContext';
import { createSyncOperation, runWriteWithSync } from './syncOutbox';

export const initializeExpensesTable = () => {
  try {
    db.runSync(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batchId INTEGER,
        itemName TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        notes TEXT,
        FOREIGN KEY (batchId) REFERENCES batches (id) ON DELETE RESTRICT
      )
    `);
  } catch (error) {
    console.error('Error creating expenses table:', error);
  }
};

export const addExpense = (batchId, itemName, category, amount, date, notes = '') => {
  try {
    const projectId = getActiveProjectId();
    const result = runWriteWithSync(
      () => db.runSync(
        'INSERT INTO expenses (projectId, batchId, itemName, category, amount, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [projectId, batchId, itemName, category, amount, date, notes]
      ),
      insertResult => createSyncOperation({ projectId, entityType: 'expense', entityId: insertResult.lastInsertRowId, action: 'create', payload: { batchId, itemName, category, amount, date, notes, id: insertResult.lastInsertRowId, projectId } })
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding expense:', error);
    return null;
  }
};

export const getExpensesByBatch = (batchId) => {
  try {
    return db.getAllSync('SELECT * FROM expenses WHERE projectId=? AND batchId = ? ORDER BY date DESC', [getActiveProjectId(), batchId]);
  } catch (error) {
    console.error('Error getting expenses:', error);
    return [];
  }
};

export const getTotalExpensesByBatch = (batchId) => {
  try {
    const result = db.getFirstSync('SELECT SUM(amount) as total FROM expenses WHERE projectId=? AND batchId = ?', [getActiveProjectId(), batchId]);
    return result?.total || 0;
  } catch (error) {
    console.error('Error getting total expenses:', error);
    return 0;
  }
};

export const deleteExpense = (id) => {
  try {
    db.runSync('DELETE FROM expenses WHERE id = ? AND projectId=?', [id, getActiveProjectId()]);
    return true;
  } catch (error) {
    console.error('Error deleting expense:', error);
    return false;
  }
};