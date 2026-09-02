import { logger } from './logger';

/**
 * Supabase Offline / Disconnected Adapter
 * All data operations run locally using browser memory and localStorage.
 * No network calls are made to Supabase.
 */

const LOCAL_USER_ID = 'local-user-001';

export const localUser = {
  id: LOCAL_USER_ID,
  email: 'tasnem@byd.local',
  uniqueId: 'tasnem',
  daysActive: 3,
  lastActiveDate: new Date().toISOString(),
  user_metadata: {
    full_name: 'Tasnem Hossen',
    avatar_url: ''
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString()
};

export const localSession = {
  access_token: 'local-access-token',
  token_type: 'bearer',
  expires_in: 3600 * 24 * 365,
  refresh_token: 'local-refresh-token',
  user: localUser
};

function getLocalTable(table: string): any[] {
  try {
    const raw = localStorage.getItem(`byd_table_${table}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    logger.error(`Error reading local table ${table}:`, e);
  }

  const today = new Date().toISOString().split('T')[0];
  if (table === 'profiles') {
    return [{
      id: LOCAL_USER_ID,
      username: 'tasnem',
      full_name: 'Tasnem Hossen',
      avatar_url: '',
      institution: '',
      class: '',
      subject_group: '',
      year: '',
      gender: 'Male',
      depex_mode: false
    }];
  }
  if (table === 'user_streaks') {
    return [{
      user_id: LOCAL_USER_ID,
      streak_count: 3,
      last_streak_date: today,
      consecutive_missed_days: 0,
      season_start_date: today
    }];
  }
  if (table === 'user_preferences') {
    return [{
      user_id: LOCAL_USER_ID,
      daily_focus_goal_minutes: 120,
      daily_calorie_goal: 2000,
      daily_step_goal: 10000,
      daily_sleep_goal: 8,
      daily_hydration_goal: 8,
      daily_screen_time_goal: 4
    }];
  }
  if (table === 'academic_settings') {
    return [{
      user_id: LOCAL_USER_ID,
      examDate: null,
      focusSubjectId: null,
      prepStartDate: null
    }];
  }
  if (table === 'macro_data') {
    return [{
      user_id: LOCAL_USER_ID,
      entry_date: today,
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0
    }];
  }

  return [];
}

function saveLocalTable(table: string, data: any[]) {
  try {
    localStorage.setItem(`byd_table_${table}`, JSON.stringify(data));
  } catch (e) {
    logger.error(`Error saving local table ${table}:`, e);
  }
}

class QueryBuilder {
  private table: string;
  private filters: Array<(item: any) => boolean> = [];
  private isSingle = false;
  private isMaybeSingle = false;
  private limitCount?: number;
  private sortField?: string;
  private sortAsc = true;
  private action: 'select' | 'insert' | 'upsert' | 'update' | 'delete' = 'select';
  private payload: any = null;

  constructor(table: string) {
    this.table = table;
  }

  select(_cols?: string) {
    this.action = 'select';
    return this;
  }

  insert(data: any) {
    this.action = 'insert';
    this.payload = data;
    return this;
  }

  upsert(data: any, _options?: any) {
    this.action = 'upsert';
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.payload = data;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(field: string, val: any) {
    this.filters.push(item => item && item[field] === val);
    return this;
  }

  neq(field: string, val: any) {
    this.filters.push(item => item && item[field] !== val);
    return this;
  }

  gte(field: string, val: any) {
    this.filters.push(item => item && item[field] >= val);
    return this;
  }

  lte(field: string, val: any) {
    this.filters.push(item => item && item[field] <= val);
    return this;
  }

  gt(field: string, val: any) {
    this.filters.push(item => item && item[field] > val);
    return this;
  }

  lt(field: string, val: any) {
    this.filters.push(item => item && item[field] < val);
    return this;
  }

  in(field: string, vals: any[]) {
    this.filters.push(item => item && vals.includes(item[field]));
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.sortField = field;
    this.sortAsc = options?.ascending !== false;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  private execute() {
    let items = getLocalTable(this.table);

    if (this.action === 'insert' || this.action === 'upsert') {
      const newItems = Array.isArray(this.payload) ? this.payload : [this.payload];
      for (const item of newItems) {
        const idKey = item.id ? 'id' : item.user_id ? 'user_id' : item.session_id ? 'session_id' : null;
        if (idKey && item[idKey]) {
          const idx = items.findIndex(x => x[idKey] === item[idKey]);
          if (idx >= 0) {
            items[idx] = { ...items[idx], ...item };
          } else {
            items.push(item);
          }
        } else {
          items.push(item);
        }
      }
      saveLocalTable(this.table, items);
      return { data: Array.isArray(this.payload) ? newItems : newItems[0], error: null };
    }

    if (this.action === 'update') {
      items = items.map(item => {
        const matches = this.filters.every(f => f(item));
        return matches ? { ...item, ...this.payload } : item;
      });
      saveLocalTable(this.table, items);
      return { data: this.payload, error: null };
    }

    if (this.action === 'delete') {
      const remaining = items.filter(item => !this.filters.every(f => f(item)));
      saveLocalTable(this.table, remaining);
      return { data: null, error: null };
    }

    // select
    let result = items.filter(item => this.filters.every(f => f(item)));

    if (this.sortField) {
      const field = this.sortField;
      result.sort((a, b) => {
        if (a[field] < b[field]) return this.sortAsc ? -1 : 1;
        if (a[field] > b[field]) return this.sortAsc ? 1 : -1;
        return 0;
      });
    }

    if (typeof this.limitCount === 'number') {
      result = result.slice(0, this.limitCount);
    }

    if (this.isSingle || this.isMaybeSingle) {
      return { data: result[0] || null, error: null };
    }

    return { data: result, error: null, count: result.length };
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

const authListeners = new Set<(event: string, session: any) => void>();

function getStoredSession() {
  try {
    const raw = localStorage.getItem('byd_auth_session');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    logger.error('Error reading stored session:', e);
  }
  return null;
}

export const supabase: any = {
  from(table: string) {
    return new QueryBuilder(table);
  },

  auth: {
    async getSession() {
      const session = getStoredSession();
      return { data: { session }, error: null };
    },
    async getUser() {
      const session = getStoredSession();
      return { data: { user: session ? session.user : null }, error: null };
    },
    onAuthStateChange(callback: (event: string, session: any) => void) {
      authListeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners.delete(callback);
            }
          }
        }
      };
    },
    async signInWithPassword(credentials: any = {}) {
      const email = credentials?.email || 'tasnem@byd.local';
      const username = email.split('@')[0] || 'tasnem';
      const user = {
        ...localUser,
        email,
        uniqueId: username,
        user_metadata: {
          ...localUser.user_metadata,
          username,
          full_name: credentials?.full_name || username
        }
      };
      const session = {
        ...localSession,
        user
      };
      try {
        localStorage.setItem('byd_auth_session', JSON.stringify(session));
      } catch (e) {}
      authListeners.forEach(cb => cb('SIGNED_IN', session));
      return { data: { user, session }, error: null };
    },
    async signUp(credentials: any = {}) {
      const email = credentials?.email || 'tasnem@byd.local';
      const username = email.split('@')[0] || 'tasnem';
      const user = {
        ...localUser,
        email,
        uniqueId: username,
        user_metadata: {
          ...localUser.user_metadata,
          username,
          full_name: credentials?.options?.data?.full_name || username
        }
      };
      const session = {
        ...localSession,
        user
      };
      try {
        localStorage.setItem('byd_auth_session', JSON.stringify(session));
      } catch (e) {}
      authListeners.forEach(cb => cb('SIGNED_IN', session));
      return { data: { user, session }, error: null };
    },
    async signInWithOAuth() {
      return { data: {}, error: null };
    },
    async verifyOtp(credentials: any = {}) {
      const email = credentials?.email || 'tasnem@byd.local';
      const username = email.split('@')[0] || 'tasnem';
      const user = {
        ...localUser,
        email,
        uniqueId: username,
        user_metadata: {
          ...localUser.user_metadata,
          username,
          full_name: username
        }
      };
      const session = {
        ...localSession,
        user
      };
      try {
        localStorage.setItem('byd_auth_session', JSON.stringify(session));
      } catch (e) {}
      authListeners.forEach(cb => cb('SIGNED_IN', session));
      return { data: { user, session }, error: null };
    },
    async resend() {
      return { data: {}, error: null };
    },
    async signOut() {
      try {
        localStorage.removeItem('byd_auth_session');
      } catch (e) {}
      authListeners.forEach(cb => cb('SIGNED_OUT', null));
      return { error: null };
    }
  },

  storage: {
    from(_bucket: string) {
      return {
        async upload(filePath: string, file: any) {
          let publicUrl = '';
          if (typeof window !== 'undefined' && file instanceof Blob) {
            publicUrl = URL.createObjectURL(file);
          }
          localStorage.setItem(`byd_file_${filePath}`, publicUrl);
          return { data: { path: filePath }, error: null };
        },
        getPublicUrl(filePath: string) {
          const publicUrl = localStorage.getItem(`byd_file_${filePath}`) || '';
          return { data: { publicUrl } };
        }
      };
    }
  },

  channel(_name: string) {
    const ch = {
      on() { return ch; },
      subscribe() { return ch; },
      unsubscribe() {}
    };
    return ch;
  },

  removeChannel() {
    return Promise.resolve();
  },

  removeAllChannels() {
    return Promise.resolve([]);
  }
};

