import React, { useState } from 'react';
import { UserSettings } from '../types';
import { Settings, Volume2, RotateCcw, AlertTriangle, X } from 'lucide-react';
import { speechEngine } from '../services/speechEngine';

interface SettingsModalProps {
  isOpen: boolean;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onResetProgress,
  onClose
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const voices = speechEngine.getVoices();

  if (!isOpen) return null;

  const handleChange = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 120
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--border-main)',
          maxWidth: '520px',
          width: '100%',
          padding: '1.75rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={20} style={{ color: 'var(--accent)' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Practice Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ padding: '4px', borderRadius: '6px', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Voice Selection */}
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
            Speech Synthesis Voice
          </label>
          <select
            value={settings.selectedVoiceURI || ''}
            onChange={(e) => {
              handleChange('selectedVoiceURI', e.target.value || null);
              if (e.target.value) {
                speechEngine.setVoice(e.target.value);
              }
            }}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '8px',
              border: '1px solid var(--border-main)',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              backgroundColor: '#ffffff'
            }}
          >
            <option value="">Default English Voice</option>
            {voices.map(v => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>

        {/* Speech Speed */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Speech Speed
            </label>
            <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent)' }}>
              {settings.speechSpeed.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={settings.speechSpeed}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              handleChange('speechSpeed', val);
              speechEngine.setSpeed(val);
            }}
            style={{ width: '100%', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <span>0.5x (Slow)</span>
            <span>0.8x (Default)</span>
            <span>1.5x (Fast)</span>
          </div>
        </div>

        {/* Words at Once Dictation Setting */}
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
            Words Dictated at Once
          </label>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { label: '1 word', val: 1 },
              { label: '2 words', val: 2 },
              { label: '3 words (Default)', val: 3 },
              { label: '4 words', val: 4 },
              { label: 'Full Sentence', val: 0 }
            ].map(opt => (
              <button
                key={opt.val}
                type="button"
                onClick={() => handleChange('wordsPerChunk', opt.val)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: settings.wordsPerChunk === opt.val ? '1.5px solid var(--accent)' : '1px solid var(--border-main)',
                  backgroundColor: settings.wordsPerChunk === opt.val ? 'var(--bg-muted)' : '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  color: settings.wordsPerChunk === opt.val ? 'var(--accent)' : 'var(--text-secondary)'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Teacher speaks this many words, waits for you to write them, then speaks the next words.
          </p>
        </div>

        {/* Automatic Repeat Count */}
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
            Automatic Sentence Repeats
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {([1, 2, 3] as const).map(num => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  handleChange('repeatCount', num);
                  speechEngine.setRepeatCount(num);
                }}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: settings.repeatCount === num ? '1.5px solid var(--accent)' : '1px solid var(--border-main)',
                  backgroundColor: settings.repeatCount === num ? 'var(--bg-muted)' : '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: settings.repeatCount === num ? 'var(--accent)' : 'var(--text-secondary)'
                }}
              >
                {num}x {num === 1 ? '(Once)' : `${num} times`}
              </button>
            ))}
          </div>
        </div>

        {/* Auto Advance Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem',
          backgroundColor: 'var(--bg-muted)',
          borderRadius: '8px'
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Auto-Advance on 100% Correct
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              Smoothly transition to the next sentence when completely accurate
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.autoAdvanceOnCorrect}
            onChange={(e) => handleChange('autoAdvanceOnCorrect', e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>

        {/* Reset Progress Section */}
        <div style={{
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              style={{
                fontSize: '0.82rem',
                color: 'var(--color-red)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600
              }}
            >
              <RotateCcw size={14} />
              <span>Reset All Lesson Progress</span>
            </button>
          ) : (
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'var(--color-red-bg)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-red)', fontSize: '0.82rem', fontWeight: 600 }}>
                <AlertTriangle size={15} />
                <span>Erase all saved scores and completed lessons?</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    border: '1px solid var(--border-main)',
                    backgroundColor: '#ffffff'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onResetProgress();
                    setShowResetConfirm(false);
                    onClose();
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    backgroundColor: 'var(--color-red)',
                    color: '#ffffff',
                    fontWeight: 600
                  }}
                >
                  Yes, Reset Everything
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              backgroundColor: 'var(--brand-primary)',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
