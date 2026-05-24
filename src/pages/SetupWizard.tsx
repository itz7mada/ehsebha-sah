import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import * as db from '../db/database';
import { generateId, now } from '../utils/formatting';
import { DEFAULT_CATEGORIES } from '../types';
import type { Settings, Category, SupportItem, JourneyEvent, HousingSituation } from '../types';

import { OnboardingShell } from '../components/wizard/OnboardingShell';
import Step1Name from '../components/wizard/Step1Name';
import Step2Welcome from '../components/wizard/Step2Welcome';
import Step3Date from '../components/wizard/Step3Date';
import Step4Budget from '../components/wizard/Step4Budget';
import Step5Emergency from '../components/wizard/Step5Emergency';
import Step6Support, { type SupportEntry } from '../components/wizard/Step5Support';
import Step7Housing from '../components/wizard/Step6Housing';
import Step8Categories from '../components/wizard/Step6Categories';

const TOTAL_STEPS = 8;

interface WizardData {
  name: string;
  weddingDate: string;
  budget: number;
  emergencyReserve: number;
  emergencyReserveMode: 'from_budget' | 'extra';
  supportChoice: 'yes' | 'later' | 'no';
  supportItems: SupportEntry[];
  housingSituation?: HousingSituation;
  selectedCategories: string[];
}

const initialData: WizardData = {
  name: '',
  weddingDate: '',
  budget: 0,
  emergencyReserve: 0,
  emergencyReserveMode: 'from_budget',
  supportChoice: 'later',
  supportItems: [],
  housingSituation: undefined,
  selectedCategories: [],
};

export default function SetupWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const { dispatch, refreshData } = useApp();
  const navigate = useNavigate();

  function patch<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function goToStep(next: number) {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 180);
  }

  function handleNext() {
    if (step < TOTAL_STEPS) goToStep(step + 1);
  }

  function handleBack() {
    if (step > 1) goToStep(step - 1);
  }

  function toggleCategory(name: string) {
    const current = data.selectedCategories;
    const updated = current.includes(name)
      ? current.filter((n) => n !== name)
      : [...current, name];
    patch('selectedCategories', updated);
  }

  async function handleComplete() {
    setSaving(true);
    setError(null);

    try {
      const timestamp = now();
      const settings: Settings = {
        id: 'settings',
        name: data.name.trim(),
        weddingDate: data.weddingDate,
        budget: data.budget,
        emergencyReserve: data.emergencyReserve,
        emergencyReserveMode: data.emergencyReserveMode,
        theme: 'system',
        setupComplete: true,
        housingSituation: data.housingSituation,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const categoriesToSave: Category[] = DEFAULT_CATEGORIES.map((cat) => ({
        ...cat,
        id: generateId(),
        isActive: data.selectedCategories.includes(cat.name),
      }));

      const journeyEvent: JourneyEvent = {
        id: generateId(),
        type: 'setup_complete',
        title: 'بدأت التخطيط لرحلة الزواج',
        date: timestamp,
      };

      const supportToSave: SupportItem[] = data.supportItems.map((entry) => ({
        id: generateId(),
        name: entry.name,
        relation: entry.relation,
        amount: entry.amount,
        status: entry.status,
        createdAt: timestamp,
        updatedAt: timestamp,
      }));

      await db.saveSettings(settings);
      await db.bulkSaveCategories(categoriesToSave);
      await Promise.all(supportToSave.map((s) => db.saveSupport(s)));
      await db.addJourneyEvent(journeyEvent);

      dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
      dispatch({ type: 'SET_CATEGORIES', payload: categoriesToSave });
      dispatch({ type: 'ADD_JOURNEY', payload: journeyEvent });

      await refreshData();
      navigate('/dashboard');
    } catch (err) {
      console.error('Setup failed:', err);
      setError('حدث خطأ أثناء الحفظ. حاول مرة أخرى.');
      setSaving(false);
    }
  }

  return (
    <OnboardingShell step={step} totalSteps={TOTAL_STEPS} onBack={handleBack} animating={animating}>
      {step === 1 && (
        <Step1Name value={data.name} onChange={(v) => patch('name', v)} onNext={handleNext} />
      )}
      {step === 2 && (
        <Step2Welcome name={data.name} onNext={handleNext} />
      )}
      {step === 3 && (
        <Step3Date value={data.weddingDate} onChange={(v) => patch('weddingDate', v)} onNext={handleNext} />
      )}
      {step === 4 && (
        <Step4Budget value={data.budget} onChange={(v) => patch('budget', v)} onNext={handleNext} />
      )}
      {step === 5 && (
        <Step5Emergency
          budget={data.budget}
          value={data.emergencyReserve}
          mode={data.emergencyReserveMode}
          onChange={(amount, mode) => {
            patch('emergencyReserve', amount);
            patch('emergencyReserveMode', mode);
          }}
          onNext={handleNext}
        />
      )}
      {step === 6 && (
        <Step6Support
          choice={data.supportChoice}
          onChoiceChange={(c) => patch('supportChoice', c)}
          items={data.supportItems}
          onItemsChange={(items) => patch('supportItems', items)}
          onNext={handleNext}
        />
      )}
      {step === 7 && (
        <Step7Housing
          value={data.housingSituation}
          onChange={(v) => patch('housingSituation', v)}
          onNext={handleNext}
        />
      )}
      {step === 8 && (
        <Step8Categories
          selected={data.selectedCategories}
          onToggle={toggleCategory}
          onComplete={handleComplete}
          loading={saving}
        />
      )}

      {error && (
        <div style={errorBannerStyle}>
          <span>⚠️ {error}</span>
          <button type="button" style={errorDismissStyle} onClick={() => setError(null)}>✕</button>
        </div>
      )}
    </OnboardingShell>
  );
}

const errorBannerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 'calc(var(--space-8) + env(safe-area-inset-bottom, 0px))',
  right: '50%',
  transform: 'translateX(50%)',
  background: 'var(--danger)',
  color: 'var(--text-inverse)',
  padding: 'var(--space-3) var(--space-5)',
  borderRadius: 'var(--radius-full)',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  boxShadow: 'var(--shadow-lg)',
  zIndex: 100,
  maxWidth: '340px',
  width: 'calc(100% - var(--space-8))',
  fontFamily: 'var(--font-family)',
};

const errorDismissStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'inherit',
  cursor: 'pointer',
  padding: 0,
  fontSize: '14px',
  lineHeight: 1,
  flexShrink: 0,
};
