import { db } from './db';

const LEGACY_PROJECT_ID = 'legacy-local-project';

const addColumnIfMissing = (tableName, columnName, definition) => {
  const columns = db.getAllSync(`PRAGMA table_info(${tableName})`);
  if (!columns.some(column => column.name === columnName)) {
    db.execSync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
};

export const initDatabase = () => {
  db.execSync('PRAGMA foreign_keys = ON;');
  db.execSync(`
    CREATE TABLE IF NOT EXISTS sync_outbox (
      operationId TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      entityType TEXT NOT NULL,
      entityId TEXT NOT NULL,
      action TEXT NOT NULL,
      payloadJson TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      lastAttemptAt TEXT,
      lastError TEXT,
      status TEXT NOT NULL DEFAULT 'pending'
    );
    CREATE TABLE IF NOT EXISTS sync_state (
      projectId TEXT PRIMARY KEY,
      lastServerCursor INTEGER NOT NULL DEFAULT 0,
      lastSuccessfulSync TEXT,
      lastError TEXT,
      status TEXT NOT NULL DEFAULT 'offline'
    );
    CREATE TABLE IF NOT EXISTS sync_applied_operations (
      operationId TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      appliedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sync_outbox_project_status
      ON sync_outbox(projectId, status, createdAt);
  `);
  db.execSync(`
    CREATE TABLE IF NOT EXISTS local_projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'owner',
      isLegacy INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // BATCHES
  db.execSync(`
    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      startDate TEXT,
      initialChicks INTEGER,
      chickPrice REAL,
      expectedPricePerBird REAL,
      expectedPricePerKg REAL,
      status TEXT
    );
  `);

  // FEED
  db.execSync(`
    CREATE TABLE IF NOT EXISTS feed (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batchId INTEGER,
      type TEXT,
      quantityKg REAL,
      pricePerKg REAL,
      datePurchased TEXT,
      receiptPath TEXT,
      FOREIGN KEY (batchId) REFERENCES batches (id) ON DELETE RESTRICT
    );
  `);

  // MORTALITY
  db.execSync(`
    CREATE TABLE IF NOT EXISTS mortality (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batchId INTEGER,
      quantity INTEGER,
      date TEXT,
      reason TEXT,
      FOREIGN KEY (batchId) REFERENCES batches (id) ON DELETE RESTRICT
    );
  `);

  // CLIENTS
  db.execSync(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT
    );
  `);

  // SALES
  db.execSync(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batchId INTEGER,
      clientId INTEGER,
      saleType TEXT,
      quantity REAL,
      price REAL,
      total REAL,
      date TEXT,
      receiptPath TEXT,
      FOREIGN KEY (batchId) REFERENCES batches (id) ON DELETE RESTRICT,
      FOREIGN KEY (clientId) REFERENCES clients (id) ON DELETE RESTRICT
    );
  `);

  // EXPENSES
  db.execSync(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batchId INTEGER,
      itemName TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (batchId) REFERENCES batches (id) ON DELETE RESTRICT
    );
  `);

  addColumnIfMissing('batches', 'projectId', 'TEXT');
  addColumnIfMissing('feed', 'projectId', 'TEXT');
  addColumnIfMissing('mortality', 'projectId', 'TEXT');
  addColumnIfMissing('clients', 'projectId', 'TEXT');
  addColumnIfMissing('sales', 'projectId', 'TEXT');
  addColumnIfMissing('expenses', 'projectId', 'TEXT');

  db.runSync(
    `INSERT OR IGNORE INTO local_projects (id, name, role, isLegacy) VALUES (?, ?, 'owner', 1)`,
    [LEGACY_PROJECT_ID, 'My Poultry Project']
  );

  db.runSync(`UPDATE batches SET projectId=? WHERE projectId IS NULL`, [LEGACY_PROJECT_ID]);
  db.runSync(`UPDATE feed SET projectId=? WHERE projectId IS NULL`, [LEGACY_PROJECT_ID]);
  db.runSync(`UPDATE mortality SET projectId=? WHERE projectId IS NULL`, [LEGACY_PROJECT_ID]);
  db.runSync(`UPDATE clients SET projectId=? WHERE projectId IS NULL`, [LEGACY_PROJECT_ID]);
  db.runSync(`UPDATE sales SET projectId=? WHERE projectId IS NULL`, [LEGACY_PROJECT_ID]);
  db.runSync(`UPDATE expenses SET projectId=? WHERE projectId IS NULL`, [LEGACY_PROJECT_ID]);

  db.execSync(`CREATE INDEX IF NOT EXISTS idx_batches_project ON batches(projectId);`);
  db.execSync(`CREATE INDEX IF NOT EXISTS idx_feed_project ON feed(projectId);`);
  db.execSync(`CREATE INDEX IF NOT EXISTS idx_mortality_project ON mortality(projectId);`);
  db.execSync(`CREATE INDEX IF NOT EXISTS idx_clients_project ON clients(projectId);`);
  db.execSync(`CREATE INDEX IF NOT EXISTS idx_sales_project ON sales(projectId);`);
  db.execSync(`CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(projectId);`);
};
