import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { Settings, Category, ExpenseItem, SupportItem, JourneyEvent } from '../types';
import * as db from '../db/database';
import { calculateBudgetStats } from '../utils/calculations';
import type { BudgetStats } from '../types';

interface AppState {
  settings: Settings | null;
  categories: Category[];
  expenses: ExpenseItem[];
  support: SupportItem[];
  journey: JourneyEvent[];
  stats: BudgetStats | null;
  loading: boolean;
  initialized: boolean;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'INIT'; payload: Omit<AppState, 'loading' | 'initialized' | 'stats'> }
  | { type: 'UPDATE_SETTINGS'; payload: Settings }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'UPSERT_EXPENSE'; payload: ExpenseItem }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'UPSERT_SUPPORT'; payload: SupportItem }
  | { type: 'DELETE_SUPPORT'; payload: string }
  | { type: 'ADD_JOURNEY'; payload: JourneyEvent }
  | { type: 'REMOVE_JOURNEY_BY_EXPENSE'; payload: string }
  | { type: 'REMOVE_JOURNEY_BY_CATEGORY'; payload: string }
  | { type: 'RESET' };

function computeStats(state: Omit<AppState, 'stats' | 'loading' | 'initialized'>): BudgetStats | null {
  if (!state.settings) return null;
  return calculateBudgetStats(state.settings, state.expenses, state.support);
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'INIT': {
      const next = { ...state, ...action.payload, initialized: true, loading: false };
      return { ...next, stats: computeStats(next) };
    }
    case 'UPDATE_SETTINGS': {
      const next = { ...state, settings: action.payload };
      return { ...next, stats: computeStats(next) };
    }
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'UPSERT_EXPENSE': {
      const exists = state.expenses.findIndex(e => e.id === action.payload.id);
      const expenses = exists >= 0
        ? state.expenses.map(e => e.id === action.payload.id ? action.payload : e)
        : [...state.expenses, action.payload];
      const next = { ...state, expenses };
      return { ...next, stats: computeStats(next) };
    }
    case 'DELETE_EXPENSE': {
      const next = { ...state, expenses: state.expenses.filter(e => e.id !== action.payload) };
      return { ...next, stats: computeStats(next) };
    }
    case 'UPSERT_SUPPORT': {
      const exists = state.support.findIndex(s => s.id === action.payload.id);
      const support = exists >= 0
        ? state.support.map(s => s.id === action.payload.id ? action.payload : s)
        : [...state.support, action.payload];
      const next = { ...state, support };
      return { ...next, stats: computeStats(next) };
    }
    case 'DELETE_SUPPORT': {
      const next = { ...state, support: state.support.filter(s => s.id !== action.payload) };
      return { ...next, stats: computeStats(next) };
    }
    case 'ADD_JOURNEY':
      return { ...state, journey: [action.payload, ...state.journey] };
    case 'REMOVE_JOURNEY_BY_EXPENSE':
      return { ...state, journey: state.journey.filter(j => j.expenseId !== action.payload) };
    case 'REMOVE_JOURNEY_BY_CATEGORY':
      return { ...state, journey: state.journey.filter(j => j.categoryId !== action.payload) };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const initialState: AppState = {
  settings: null,
  categories: [],
  expenses: [],
  support: [],
  journey: [],
  stats: null,
  loading: true,
  initialized: false,
};

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const refreshData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [settings, categories, expenses, support, journey] = await Promise.all([
        db.getSettings(),
        db.getAllCategories(),
        db.getAllExpenses(),
        db.getAllSupport(),
        db.getAllJourney(),
      ]);
      dispatch({
        type: 'INIT',
        payload: {
          settings: settings ?? null,
          categories,
          expenses,
          support,
          journey,
        },
      });
    } catch (err) {
      console.error('Failed to load data:', err);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <AppContext.Provider value={{ state, dispatch, refreshData }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
