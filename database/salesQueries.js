import { db } from './db';
import { getActiveProjectId } from './projectContext';
import { createSyncOperation, runWriteWithSync } from './syncOutbox';

export const addSale = (sale) => {
  const projectId = getActiveProjectId();
  return runWriteWithSync(
    () => db.runSync(
      `INSERT INTO sales (projectId, batchId, clientId, saleType, quantity, price, total, date, receiptPath)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [projectId, sale.batchId, sale.clientId, sale.saleType, sale.quantity, sale.price, sale.total, sale.date, sale.receiptPath]
    ),
    result => createSyncOperation({ projectId, entityType: 'sale', entityId: result.lastInsertRowId, action: 'create', payload: { ...sale, id: result.lastInsertRowId, projectId } })
  );
};

export const getSalesByBatch = (batchId) => {
  const result = db.getFirstSync(
    `SELECT SUM(total) as revenue FROM sales WHERE projectId=? AND batchId=?`,
    [getActiveProjectId(), batchId]
  );
  return result?.revenue || 0;
};

export const getAllSales = () => {
  return db.getAllSync(`SELECT * FROM sales WHERE projectId=?`, [getActiveProjectId()]);
};

export const getSalesDetailsByBatch = (batchId) => {
  return db.getAllSync(`SELECT * FROM sales WHERE projectId=? AND batchId=?`, [getActiveProjectId(), batchId]);
};

export const getSalesByDateRange = (startDate, endDate) => {
  return db.getAllSync(`SELECT * FROM sales WHERE projectId=? AND date BETWEEN ? AND ?`, [getActiveProjectId(), startDate, endDate]);
};

export const getTotalSalesInDateRange = (startDate, endDate) => {
  const result = db.getFirstSync(
    `SELECT SUM(total) AS totalSales FROM sales WHERE projectId=? AND date BETWEEN ? AND ?`,
    [getActiveProjectId(), startDate, endDate]
  );
  return result.totalSales || 0;
};

export const deleteSaleById = (id) => {
  db.runSync(`DELETE FROM sales WHERE id = ? AND projectId=?`, [id, getActiveProjectId()]);
};

export const updateSale = (sale) => {
  db.runSync(
    `UPDATE sales SET clientId=?, saleType=?, quantity=?, price=?, total=?, date=?, receiptPath=? WHERE id=? AND projectId=?`,
    [sale.clientId, sale.saleType, sale.quantity, sale.price, sale.total, sale.date, sale.receiptPath, sale.id, getActiveProjectId()]
  );
};

export const getSalesByClientId = (clientId) => {
  return db.getAllSync(`SELECT * FROM sales WHERE projectId=? AND clientId = ?`, [getActiveProjectId(), clientId]);
};

export const getTotalSalesByClientId = (clientId) => {
  const result = db.getFirstSync(
    `SELECT SUM(total) AS totalSales FROM sales WHERE projectId=? AND clientId = ?`,
    [getActiveProjectId(), clientId]
  );
  return result.totalSales || 0;
};

export const getSalesCount = () => {
  const result = db.getFirstSync(`SELECT COUNT(*) AS count FROM sales WHERE projectId=?`, [getActiveProjectId()]);
  return result.count || 0;
};

export const getSalesWithClientInfo = () => {
  return db.getAllSync(
    `SELECT sales.*, clients.name AS clientName, clients.phone AS clientPhone FROM sales JOIN clients ON sales.clientId = clients.id AND clients.projectId = sales.projectId WHERE sales.projectId=?`,
    [getActiveProjectId()]
  );
};

export const getSalesByBatchAndDateRange = (batchId, startDate, endDate) => {
  return db.getAllSync(
    `SELECT * FROM sales WHERE projectId=? AND batchId = ? AND date BETWEEN ? AND ?`,
    [getActiveProjectId(), batchId, startDate, endDate]
  );
};

export const getTotalSalesByBatchAndDateRange = (batchId, startDate, endDate) => {
  const result = db.getFirstSync(
    `SELECT SUM(total) AS totalSales FROM sales WHERE projectId=? AND batchId = ? AND date BETWEEN ? AND ?`,
    [getActiveProjectId(), batchId, startDate, endDate]
  );
  return result.totalSales || 0;
};

export const getAverageSalePriceByBatch = (batchId) => {
  const result = db.getFirstSync(
    `SELECT AVG(price) AS averagePrice FROM sales WHERE projectId=? AND batchId = ?`,
    [getActiveProjectId(), batchId]
  );
  return result.averagePrice || 0;
};

export const getTopClientsBySales = (limit) => {
  return db.getAllSync(
    `SELECT clients.id, clients.name, SUM(sales.total) AS totalSpent
     FROM sales
     JOIN clients ON sales.clientId = clients.id
    WHERE sales.projectId=?
    GROUP BY clients.id, clients.name
     ORDER BY totalSpent DESC
     LIMIT ?`,
    [getActiveProjectId(), limit]
  );
};

export const getMonthlySalesSummary = (year, month) => {
  return db.getFirstSync(
    `SELECT SUM(total) AS totalSales, COUNT(*) AS numberOfSales
     FROM sales
    WHERE projectId=? AND strftime('%Y', date) = ? AND strftime('%m', date) = ?`,
      [getActiveProjectId(), year, month]
  );
};

export const getSalesWithPagination = (limit, offset) => {
  return db.getAllSync(
    `SELECT * FROM sales WHERE projectId=? ORDER BY date DESC LIMIT ? OFFSET ?`,
    [getActiveProjectId(), limit, offset]
  );
};

export const getTotalRevenue = () => {
  try {
    const result = db.getFirstSync(`SELECT SUM(total) AS totalRevenue FROM sales WHERE projectId=?`, [getActiveProjectId()]);
    return result.totalRevenue || 0;
  } catch (error) {
    console.log('Sales table not found, returning 0');
    return 0;
  }
};

    