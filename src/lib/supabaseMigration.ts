import { supabase } from './supabaseClient';

// ============================================================================
// MIGRATION STATE & BACKUP MANAGEMENT
// ============================================================================

const supabaseClient = supabase;

export const MIGRATION_STATE = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  ROLLED_BACK: 'ROLLED_BACK',
} as const;

const MIGRATION_KEY = 'si_migration_state';
const BACKUP_KEY = 'si_backup_';
const ROLLBACK_FLAG = 'si_use_supabase';

interface MigrationState {
  status: string;
  timestamp: number;
  version: number;
  tables: string[];
  backupCreatedAt: number;
}

// Get current migration state
export function getMigrationState(): MigrationState {
  const stored = localStorage.getItem(MIGRATION_KEY);
  return stored
    ? JSON.parse(stored)
    : {
        status: MIGRATION_STATE.NOT_STARTED,
        timestamp: 0,
        version: 1,
        tables: [],
        backupCreatedAt: 0,
      };
}

// Set migration state
function setMigrationState(state: MigrationState) {
  localStorage.setItem(MIGRATION_KEY, JSON.stringify(state));
}

// ============================================================================
// BACKUP & RESTORE
// ============================================================================

interface BackupData {
  [table: string]: any[];
}

// Create automatic backup of all localStorage data
export async function createBackup(): Promise<void> {
  const state = getMigrationState();
  const backup: BackupData = {};

  const tables = ['shawarmainn_orders', 'menu'];

  for (const table of tables) {
    const data = localStorage.getItem(table);
    if (data) {
      try {
        backup[table] = JSON.parse(data);
      } catch {
        backup[table] = [data];
      }
    }
  }

  // Store backup in localStorage with timestamp
  const backupKey = `${BACKUP_KEY}${Date.now()}`;
  localStorage.setItem(backupKey, JSON.stringify(backup));

  // Keep only last 3 backups
  const allKeys = Object.keys(localStorage).filter((k) => k.startsWith(BACKUP_KEY));
  if (allKeys.length > 3) {
    allKeys.sort().slice(0, -3).forEach((k) => localStorage.removeItem(k));
  }

  state.backupCreatedAt = Date.now();
  state.tables = Object.keys(backup);
  setMigrationState(state);
}

// Restore from backup
export async function restoreFromBackup(backupTimestamp?: number): Promise<void> {
  const backupKey = backupTimestamp ? `${BACKUP_KEY}${backupTimestamp}` : undefined;
  const key = backupKey || Object.keys(localStorage).filter((k) => k.startsWith(BACKUP_KEY)).sort().pop();

  if (!key) {
    throw new Error('No backup found');
  }

  const backup = JSON.parse(localStorage.getItem(key) || '{}');

  for (const [table, data] of Object.entries(backup)) {
    localStorage.setItem(table, JSON.stringify(data));
  }

  const state = getMigrationState();
  state.status = MIGRATION_STATE.ROLLED_BACK;
  state.timestamp = Date.now();
  setMigrationState(state);
}

// ============================================================================
// AUTOMATIC DATA MIGRATION (localStorage → Supabase)
// ============================================================================

async function migrateOrders(): Promise<number> {
  const ordersData = localStorage.getItem('shawarmainn_orders');
  if (!ordersData) return 0;

  const orders = JSON.parse(ordersData);
  if (!Array.isArray(orders)) return 0;

  let insertedCount = 0;

  for (const order of orders) {
    try {
      const { error } = await supabaseClient.from('orders').insert({
        id: order.id,
        user_id: order.userId || 'pos-user',
        items: order.items,
        total: order.total,
        status: order.status || 'pending',
        created_at: order.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (!error) insertedCount++;
    } catch {
      // Skip individual failures, continue with others
    }
  }

  return insertedCount;
}

async function migrateMenuItems(): Promise<number> {
  const menuData = localStorage.getItem('menu');
  if (!menuData) return 0;

  const items = JSON.parse(menuData);
  if (!Array.isArray(items)) return 0;

  let insertedCount = 0;

  for (const item of items) {
    try {
      const { error } = await supabaseClient.from('menu_items').insert({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        image: item.image,
        description: item.description || '',
        available: item.available !== false,
      });

      if (!error) insertedCount++;
    } catch {
      // Skip duplicates and errors
    }
  }

  return insertedCount;
}

export interface MigrationSummary {
  success: boolean;
  summary: {
    orders: number;
    menuItems: number;
    errors: string[];
  };
  timestamp: number;
}

// Run full automatic migration
export async function runAutomaticMigration(): Promise<MigrationSummary> {
  const state = getMigrationState();

  // Skip if already completed
  if (state.status === MIGRATION_STATE.COMPLETED) {
    return {
      success: true,
      summary: { orders: 0, menuItems: 0, errors: [] },
      timestamp: state.timestamp,
    };
  }

  // Create backup before migration
  await createBackup();

  state.status = MIGRATION_STATE.IN_PROGRESS;
  state.timestamp = Date.now();
  setMigrationState(state);

  const errors: string[] = [];
  const summary = {
    orders: 0,
    menuItems: 0,
    errors,
  };

  try {
    // Attempt migrations
    summary.orders = await migrateOrders().catch((e) => {
      errors.push(`Orders migration failed: ${e.message}`);
      return 0;
    });

    summary.menuItems = await migrateMenuItems().catch((e) => {
      errors.push(`Menu items migration failed: ${e.message}`);
      return 0;
    });

    // Mark migration as completed
    state.status = MIGRATION_STATE.COMPLETED;
    state.timestamp = Date.now();
    localStorage.setItem(ROLLBACK_FLAG, 'true');
    setMigrationState(state);

    return {
      success: errors.length === 0,
      summary,
      timestamp: state.timestamp,
    };
  } catch (error) {
    state.status = MIGRATION_STATE.FAILED;
    state.timestamp = Date.now();
    setMigrationState(state);

    // Automatic rollback on critical failure
    await restoreFromBackup();

    return {
      success: false,
      summary: {
        orders: 0,
        menuItems: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      },
      timestamp: state.timestamp,
    };
  }
}

// ============================================================================
// HEALTH CHECK & AUTOMATIC ROLLBACK
// ============================================================================

export async function checkSupabaseHealth(): Promise<boolean> {
  try {
    const { error } = await supabaseClient.from('orders').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

// Enable/disable Supabase usage based on health
export function shouldUseSupabase(): boolean {
  // Check environment flag
  if (import.meta.env.VITE_DISABLE_SUPABASE === 'true') {
    return false;
  }

  // Check migration state
  const state = getMigrationState();
  const isSupabaseEnabled = localStorage.getItem(ROLLBACK_FLAG) === 'true';

  return state.status === MIGRATION_STATE.COMPLETED && isSupabaseEnabled;
}

// Auto-rollback if Supabase is unavailable
export async function initializeWithHealthCheck(): Promise<void> {
  if (!shouldUseSupabase()) return;

  const isHealthy = await checkSupabaseHealth();

  if (!isHealthy) {
    console.warn('Supabase health check failed. Rolling back to localStorage.');
    localStorage.setItem(ROLLBACK_FLAG, 'false');
  }
}

// ============================================================================
// DUAL-WRITE UTILITIES (write to both localStorage and Supabase)
// ============================================================================

export async function writeOrderToBoth(order: any): Promise<void> {
  // Write to localStorage (always)
  const orders = JSON.parse(localStorage.getItem('shawarmainn_orders') || '[]');
  orders.push(order);
  localStorage.setItem('shawarmainn_orders', JSON.stringify(orders));

  // Write to Supabase (if enabled)
  if (shouldUseSupabase()) {
    try {
      await supabaseClient.from('orders').insert({
        id: order.id,
        user_id: order.userId || 'pos-user',
        items: order.items,
        total: order.total,
        status: order.status || 'pending',
        created_at: order.createdAt || new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to write order to Supabase:', error);
      // localStorage write succeeded, so operation is safe
    }
  }
}

// ============================================================================
// MONITORING & DIAGNOSTICS
// ============================================================================

export function getMigrationDiagnostics() {
  const state = getMigrationState();
  const isHealthy = localStorage.getItem(ROLLBACK_FLAG) === 'true';
  const backups = Object.keys(localStorage).filter((k) => k.startsWith(BACKUP_KEY));

  return {
    migrationState: state,
    supabaseEnabled: isHealthy,
    backupsAvailable: backups.length,
    canRollback: backups.length > 0,
    lastBackup: state.backupCreatedAt,
    environment: import.meta.env.MODE,
  };
}
