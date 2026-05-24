import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type {
  Settings, Category, ExpenseItem, SupportItem, JourneyEvent, BackupData, SuggestionItem, Transaction
} from '../types';

interface ZawajDB extends DBSchema {
  settings: { key: string; value: Settings };
  categories: { key: string; value: Category; indexes: { 'by-order': number } };
  expenses: { key: string; value: ExpenseItem; indexes: { 'by-category': string; 'by-due-date': string } };
  support: { key: string; value: SupportItem; indexes: { 'by-status': string } };
  journey: { key: string; value: JourneyEvent; indexes: { 'by-date': string } };
  suggestions: { key: string; value: SuggestionItem };
  transactions: { key: string; value: Transaction; indexes: { 'by-item': string } };
}

const DB_NAME = 'zawaj-bewai-db';
const DB_VERSION = 3;

let dbInstance: IDBPDatabase<ZawajDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<ZawajDB>> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB<ZawajDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const settingsStore = db.createObjectStore('settings', { keyPath: 'id' });
        void settingsStore;
        const catStore = db.createObjectStore('categories', { keyPath: 'id' });
        catStore.createIndex('by-order', 'order');
        const expStore = db.createObjectStore('expenses', { keyPath: 'id' });
        expStore.createIndex('by-category', 'categoryId');
        expStore.createIndex('by-due-date', 'dueDate');
        const supStore = db.createObjectStore('support', { keyPath: 'id' });
        supStore.createIndex('by-status', 'status');
        const journeyStore = db.createObjectStore('journey', { keyPath: 'id' });
        journeyStore.createIndex('by-date', 'date');
      }
      if (oldVersion < 2) {
        db.createObjectStore('suggestions', { keyPath: 'id' });
      }
      if (oldVersion < 3) {
        const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
        txStore.createIndex('by-item', 'itemId');
      }
    },
  });
  return dbInstance;
}

// Settings
export async function getSettings(): Promise<Settings | undefined> {
  const db = await getDB();
  return db.get('settings', 'settings');
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings);
}

// Categories
export async function getAllCategories(): Promise<Category[]> {
  const db = await getDB();
  return db.getAllFromIndex('categories', 'by-order');
}

export async function saveCategory(category: Category): Promise<void> {
  const db = await getDB();
  await db.put('categories', category);
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('categories', id);
}

export async function bulkSaveCategories(categories: Category[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('categories', 'readwrite');
  await Promise.all(categories.map(c => tx.store.put(c)));
  await tx.done;
}

// Expenses
export async function getAllExpenses(): Promise<ExpenseItem[]> {
  const db = await getDB();
  return db.getAll('expenses');
}

export async function getExpensesByCategory(categoryId: string): Promise<ExpenseItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('expenses', 'by-category', categoryId);
}

export async function saveExpense(expense: ExpenseItem): Promise<void> {
  const db = await getDB();
  await db.put('expenses', expense);
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('expenses', id);
}

// Support
export async function getAllSupport(): Promise<SupportItem[]> {
  const db = await getDB();
  return db.getAll('support');
}

export async function saveSupport(item: SupportItem): Promise<void> {
  const db = await getDB();
  await db.put('support', item);
}

export async function deleteSupport(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('support', id);
}

// Journey
export async function getAllJourney(): Promise<JourneyEvent[]> {
  const db = await getDB();
  const events = await db.getAllFromIndex('journey', 'by-date');
  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addJourneyEvent(event: JourneyEvent): Promise<void> {
  const db = await getDB();
  await db.put('journey', event);
}

export async function deleteJourneyEventsByExpense(expenseId: string): Promise<void> {
  const db = await getDB();
  const all = await db.getAll('journey');
  await Promise.all(
    all.filter(j => j.expenseId === expenseId).map(j => db.delete('journey', j.id))
  );
}

export async function deleteJourneyEventsByCategory(categoryId: string): Promise<void> {
  const db = await getDB();
  const all = await db.getAll('journey');
  await Promise.all(
    all.filter(j => j.categoryId === categoryId).map(j => db.delete('journey', j.id))
  );
}

// Transactions
export async function getTransactionsByItem(itemId: string): Promise<Transaction[]> {
  const db = await getDB();
  return db.getAllFromIndex('transactions', 'by-item', itemId);
}

export async function saveTransaction(tx: Transaction): Promise<void> {
  const db = await getDB();
  await db.put('transactions', tx);
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('transactions', id);
}

export async function deleteTransactionsByItem(itemId: string): Promise<void> {
  const txs = await getTransactionsByItem(itemId);
  const db = await getDB();
  await Promise.all(txs.map(t => db.delete('transactions', t.id)));
}

// Suggestions
export async function saveSuggestion(item: SuggestionItem): Promise<void> {
  const db = await getDB();
  await db.put('suggestions', item);
}

// Backup & Restore
export async function exportBackup(): Promise<BackupData> {
  const [settings, categories, expenses, support, journey] = await Promise.all([
    getSettings(),
    getAllCategories(),
    getAllExpenses(),
    getAllSupport(),
    getAllJourney(),
  ]);
  if (!settings) throw new Error('No settings found');
  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    settings,
    categories,
    expenses,
    support,
    journey,
  };
}

export async function importBackup(data: BackupData): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['settings', 'categories', 'expenses', 'support', 'journey'], 'readwrite');
  const [settingsStore, catStore, expStore, supStore, journeyStore] = [
    tx.objectStore('settings'),
    tx.objectStore('categories'),
    tx.objectStore('expenses'),
    tx.objectStore('support'),
    tx.objectStore('journey'),
  ];
  await settingsStore.clear();
  await catStore.clear();
  await expStore.clear();
  await supStore.clear();
  await journeyStore.clear();
  await settingsStore.put(data.settings);
  await Promise.all(data.categories.map(c => catStore.put(c)));
  await Promise.all(data.expenses.map(e => expStore.put(e)));
  await Promise.all(data.support.map(s => supStore.put(s)));
  await Promise.all(data.journey.map(j => journeyStore.put(j)));
  await tx.done;
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['settings', 'categories', 'expenses', 'support', 'journey'], 'readwrite');
  await Promise.all([
    tx.objectStore('settings').clear(),
    tx.objectStore('categories').clear(),
    tx.objectStore('expenses').clear(),
    tx.objectStore('support').clear(),
    tx.objectStore('journey').clear(),
  ]);
  await tx.done;
}
