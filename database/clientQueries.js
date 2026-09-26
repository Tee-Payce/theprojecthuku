import { db } from './db';
import { getActiveProjectId } from './projectContext';
import { createSyncOperation, runWriteWithSync } from './syncOutbox';

export const addClient = (client) => {
  const projectId = getActiveProjectId();
  const result = runWriteWithSync(
    () => db.runSync(`INSERT INTO clients (projectId, name, phone) VALUES (?, ?, ?)`, [projectId, client.name, client.phone]),
    insertResult => createSyncOperation({ projectId, entityType: 'client', entityId: insertResult.lastInsertRowId, action: 'create', payload: { ...client, id: insertResult.lastInsertRowId, projectId } })
  );
  return result.lastInsertRowId;
};

export const getClients = () => {
  try {
    return db.getAllSync(`SELECT * FROM clients WHERE projectId=?`, [getActiveProjectId()]);
  } catch (error) {
    console.log('Clients table not found, returning empty array');
    return [];
  }
};

export const getClientById = (id) => {
  return db.getFirstSync(`SELECT * FROM clients WHERE id = ? AND projectId=?`, [id, getActiveProjectId()]);
};

export const updateClient = (client) => {
  db.runSync(
    `UPDATE clients SET name = ?, phone = ? WHERE id = ? AND projectId=?`,
    [client.name, client.phone, client.id, getActiveProjectId()]
  );
};

export const deleteClient = (id) => {
  db.runSync(`DELETE FROM clients WHERE id = ? AND projectId=?`, [id, getActiveProjectId()]);
};

export const findClientsByName = (name) => {
  return db.getAllSync(`SELECT * FROM clients WHERE projectId=? AND name LIKE ?`, [getActiveProjectId(), `%${name}%`]);
};

