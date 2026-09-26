// src/database/db.js
import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('poultry_tracker.db');

db.execSync('PRAGMA foreign_keys = ON;');
