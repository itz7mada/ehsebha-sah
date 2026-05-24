import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SectionCard } from '../components/expenses/SectionCard';
import { BottomSheet } from '../components/common/BottomSheet';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { PlusIcon, TrashIcon } from '../components/common/Icons';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import * as db from '../db/database';
import { generateId } from '../utils/formatting';
import type { Category } from '../types';

const EMOJI_OPTIONS = ['💍', '✨', '👗', '🎊', '🏠', '🌙', '🛡️', '📋', '💼', '🎁', '🎂', '🚗', '✈️', '🏥', '🎓', '📸', '🎵', '🌹', '🎀', '🌺'];

const CAT_COLORS = [
  '#C99368', '#4CAF82', '#5B9BD5', '#9B7ED8',
  '#C8657A', '#8B6548', '#5BBDAA', '#8A8F98',
];

export function Sections() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('📋');
  const [newColor, setNewColor] = useState(CAT_COLORS[0]);
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const activeCategories = state.categories
    .filter(c => c.isActive && c.name !== 'الطوارئ')
    .sort((a, b) => a.order - b.order);

  const openSheet = () => {
    setNewName('');
    setNewEmoji('📋');
    setNewColor(CAT_COLORS[activeCategories.length % CAT_COLORS.length]);
    setNameError('');
    setSheetOpen(true);
  };

  const handleAddCategory = async () => {
    if (!newName.trim()) {
      setNameError('أدخل الاسم');
      return;
    }
    setSaving(true);
    try {
      const maxOrder = state.categories.reduce((m, c) => Math.max(m, c.order), 0);
      const cat: Category = {
        id: generateId(),
        name: newName.trim(),
        emoji: newEmoji,
        color: newColor,
        isActive: true,
        order: maxOrder + 1,
        isSystem: false,
      };
      await db.saveCategory(cat);
      dispatch({ type: 'SET_CATEGORIES', payload: [...state.categories, cat] });
      setSheetOpen(false);
    } catch (err) {
      console.error('Failed to save category:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteTarget) return;
    try {
      const catExpenses = state.expenses.filter(e => e.categoryId === deleteTarget.id);
      await db.deleteJourneyEventsByCategory(deleteTarget.id);
      await Promise.all(catExpenses.map(e => db.deleteExpense(e.id)));
      await db.deleteCategory(deleteTarget.id);
      dispatch({ type: 'REMOVE_JOURNEY_BY_CATEGORY', payload: deleteTarget.id });
      catExpenses.forEach(e => dispatch({ type: 'DELETE_EXPENSE', payload: e.id }));
      dispatch({
        type: 'SET_CATEGORIES',
        payload: state.categories.filter(c => c.id !== deleteTarget.id),
      });
    } catch (err) {
      console.error('Failed to delete category:', err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    background: 'var(--bg-primary)',
    borderBottom: '1px solid var(--border-light)',
    padding: 'var(--space-4)',
    paddingTop: 'var(--page-top)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: '480px',
    margin: '0 auto',
    width: '100%',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 700,
    color: 'var(--text-primary)',
  };

  const gridStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  };

  const emojiGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 'var(--space-2)',
    marginTop: 'var(--space-2)',
  };

  const emojiButtonStyle = (selected: boolean): React.CSSProperties => ({
    fontSize: '24px',
    padding: 'var(--space-2)',
    borderRadius: 'var(--radius-md)',
    border: `2px solid ${selected ? 'var(--accent)' : 'transparent'}`,
    background: selected ? 'var(--accent-light)' : 'var(--bg-secondary)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    textAlign: 'center',
    lineHeight: 1.3,
    fontFamily: 'var(--font-family)',
  });

  const sheetLabelStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginTop: 'var(--space-4)',
    marginBottom: 'var(--space-1)',
    display: 'block',
  };

  return (
    <div className="page">
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>خطة الزواج</h1>
          <Button
            variant="ghost"
            size="sm"
            icon={<PlusIcon size={15} />}
            onClick={openSheet}
          >
            إضافة بند رئيسي
          </Button>
        </div>
      </div>

      <div className="page-content pb-safe animate-fade-in">
        {activeCategories.length === 0 ? (
          <div className="empty-state">
            <h3>لا توجد بنود رئيسية بعد</h3>
            <p>أضف أول بند رئيسي لتبدأ بتنظيم ميزانية زفافك</p>
            <div style={{ marginTop: 'var(--space-5)' }}>
              <Button variant="primary" icon={<PlusIcon size={16} />} onClick={openSheet}>
                إضافة بند رئيسي
              </Button>
            </div>
          </div>
        ) : (
          <div style={gridStyle}>
            {activeCategories.map(category => (
              <div key={category.id} style={{ position: 'relative' }}>
                <SectionCard
                  category={category}
                  expenses={state.expenses}
                  onClick={() => navigate(`/sections/${category.id}`)}
                />
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setDeleteTarget(category); }}
                  aria-label={`حذف قسم ${category.name}`}
                  style={{
                    position: 'absolute',
                    top: 'var(--space-3)',
                    insetInlineEnd: 'var(--space-3)',
                    width: '28px',
                    height: '28px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--danger-light)',
                    border: 'none',
                    color: 'var(--danger)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 2,
                  }}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Category Sheet */}
      <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} title="إضافة بند رئيسي">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', paddingBottom: 'var(--space-6)' }}>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.6 }}>
            أضف جزء من خطة الزواج يناسبك.
          </p>

          <Input
            label="الاسم"
            value={newName}
            onChange={v => { setNewName(v); if (v.trim()) setNameError(''); }}
            placeholder="مثال: التصوير"
            error={nameError}
            autoFocus
          />

          <div>
            <span style={sheetLabelStyle}>اللون</span>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-1)' }}>
              {CAT_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  aria-pressed={newColor === color}
                  onClick={() => setNewColor(color)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: color,
                    border: newColor === color ? '3px solid var(--text-primary)' : '3px solid transparent',
                    cursor: 'pointer',
                    outline: newColor === color ? `2px solid ${color}` : 'none',
                    outlineOffset: '2px',
                    transition: 'all var(--transition-fast)',
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <span style={sheetLabelStyle}>اختر رمزاً</span>
            <div style={emojiGridStyle}>
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  style={emojiButtonStyle(newEmoji === emoji)}
                  onClick={() => setNewEmoji(emoji)}
                  aria-label={emoji}
                  aria-pressed={newEmoji === emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            padding: 'var(--space-3)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: newColor, flexShrink: 0 }} />
            <span style={{ fontSize: '22px' }}>{newEmoji}</span>
            <span style={{ fontWeight: 700, color: newName.trim() ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
              {newName.trim() || 'اسم البند'}
            </span>
          </div>

          <Button variant="primary" fullWidth loading={saving} onClick={handleAddCategory}>
            إضافة البند الرئيسي
          </Button>
        </div>
      </BottomSheet>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteCategory}
        title="حذف البند الرئيسي"
        message={`هل تريد حذف "${deleteTarget?.name}"؟ ستُحذف جميع العناصر المرتبطة به.`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
      />
    </div>
  );
}

export default Sections;
