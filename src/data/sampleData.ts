import { Transaction, Category } from '../types';
import { format, subDays } from 'date-fns';

// Expense categories
export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'daily', name: 'Dépenses Quotidiennes', color: '#F87171', icon: 'coffee' },
  { id: 'transport', name: 'Transport', color: '#FBBF24', icon: 'car' },
  { id: 'leisure', name: 'Loisirs & Divertissement', color: '#818CF8', icon: 'tv' },
  { id: 'groceries', name: 'Courses', color: '#34D399', icon: 'shopping-basket' },
  { id: 'home', name: 'Maison & Services', color: '#60A5FA', icon: 'home' },
  { id: 'health', name: 'Santé & Bien-être', color: '#F472B6', icon: 'heart-pulse' },
  { id: 'travel', name: 'Voyages & Vacances', color: '#A78BFA', icon: 'plane' },
  { id: 'education', name: 'Éducation', color: '#6EE7B7', icon: 'book' },
  { id: 'savings', name: 'Épargne', color: '#059669', icon: 'piggy-bank' },
  { id: 'other', name: 'Autres Dépenses', color: '#9CA3AF', icon: 'more-horizontal' }
];

// Income categories
export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Salaire', color: '#10B981', icon: 'briefcase' },
  { id: 'freelance', name: 'Freelance', color: '#3B82F6', icon: 'laptop' },
  { id: 'investments', name: 'Investissements', color: '#8B5CF6', icon: 'trending-up' },
  { id: 'gifts', name: 'Cadeaux', color: '#EC4899', icon: 'gift' },
  { id: 'refunds', name: 'Remboursements', color: '#F59E0B', icon: 'rotate-ccw' },
  { id: 'other_income', name: 'Autres Revenus', color: '#6B7280', icon: 'plus-circle' }
];