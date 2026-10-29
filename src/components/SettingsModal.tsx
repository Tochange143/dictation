import React, { useState } from 'react';
import { UserSettings, VoiceAccent } from '../types';
import { Settings, Volume2, RotateCcw, AlertTriangle, X, Play } from 'lucide-react';
import { speechEngine, isIndianVoice } from '../services/speechEngine';

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

  const indianVoices = voices.filter(v => isIndianVoice(v));
  const usVoices = voices.filter(v => {
    const lang = (v.lang || '').toLowerCase().replace(/_/g, '-');
    return lang.startsWith('en-us') && !isIndianVoice(v);
  });
  const ukVoices = voices.filter(v => {
    const lang = (v.lang || '').toLowerCase().replace(/_/g, '-');
    return lang.startsWith('en-gb') && !isIndianVoice(v);
  });
  const otherVoices = voices.filter(v => 
    !isIndianVoice(v) && 
    !(v.lang || '').toLowerCase().replace(/_/g, '-').startsWith('en-us') && 
    !(v.lang || '').toLowerCase().replace(/_/g, '-').startsWith('en-gb')
  );

  if (!isOpen) return null;

  const handleChange = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  const handleAccentChange = (accent: VoiceAccent) => {
    speechEngine.setAccent(accent);
    const bestVoice = speechEngine.getSelectedVoice();
    onUpdateSettings({
      ...settings,
      voiceAccent: accent,
      selectedVoiceURI: bestVoice ? bestVoice.voiceURI : (accent === 'en-IN' ? 'auto:en-IN' : null)
    });
  };

  const currentAccent = settings.voiceAccent || 'en-IN';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 120
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-main)',
          maxWidth: '520px',
          width: '100%',
          padding: '1.5rem',
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

        {/* Accent & Voice Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Teacher Voice Accent
            </label>
            <button
              onClick={() => speechEngine.testVoice('The quick brown fox jumps over the lazy dog.')}
              title="Click to hear a sample of this voice"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border-main)',
                backgroundColor: 'var(--bg-muted)',
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--accent)',
                cursor: 'pointer'
              }}
            >
              <Volume2 size={13} />
              <span>Test Sound</span>
            </button>
          </div>

          {/* Accent preset buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem'
          }}>
            <button
              type="button"
              onClick={() => handleAccentChange('en-IN')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '7px 8px',
                borderRadius: '8px',
                border: currentAccent === 'en-IN' ? '2px solid #f59e0b' : '1px solid var(--border-main)',
                backgroundColor: currentAccent === 'en-IN' ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-muted)',
                color: currentAccent === 'en-IN' ? '#fbbf24' : 'var(--text-primary)',
                fontSize: '0.82rem',
                fontWeight: currentAccent === 'en-IN' ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              <span>🇮🇳 Indian Accent</span>
            </button>

            <button
              type="button"
              onClick={() => handleAccentChange('en-US')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '7px 8px',
                borderRadius: 'var(--radius-sm)',
                border: currentAccent === 'en-US' ? '1px solid var(--accent)' : '1px solid var(--border-main)',
                backgroundColor: currentAccent === 'en-US' ? 'var(--color-amber-bg)' : 'var(--bg-muted)',
                color: currentAccent === 'en-US' ? 'var(--color-amber)' : 'var(--text-primary)',
                fontSize: '0.82rem',
                fontWeight: currentAccent === 'en-US' ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              <span>🇺🇸 US English</span>
            </button>

            <button
              type="button"
              onClick={() => handleAccentChange('en-GB')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '7px 8px',
                borderRadius: 'var(--radius-sm)',
                border: currentAccent === 'en-GB' ? '1px solid var(--accent)' : '1px solid var(--border-main)',
                backgroundColor: currentAccent === 'en-GB' ? 'var(--color-amber-bg)' : 'var(--bg-muted)',
                color: currentAccent === 'en-GB' ? 'var(--color-amber)' : 'var(--text-primary)',
                fontSize: '0.82rem',
                fontWeight: currentAccent === 'en-GB' ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              <span>🇬🇧 UK English</span>
            </button>
          </div>

          {/* Specific Voice Dropdown */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
              Specific Speech Engine Voice
            </label>
            <select
              value={settings.selectedVoiceURI || (currentAccent === 'en-IN' ? 'auto:en-IN' : '')}
              onChange={(e) => {
                const val = e.target.value || null;
                handleChange('selectedVoiceURI', val);
                speechEngine.setVoice(val);
              }}
              style={{
                width: '100%',
                padding: '0.55rem',
                borderRadius: '8px',
                border: '1px solid var(--border-main)',
                fontSize: '0.83rem',
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-muted)',
                outline: 'none'
              }}
            >
              <optgroup label="🇮🇳 Indian English (en-IN)">
                <option value="auto:en-IN">🇮🇳 Auto Indian English (en-IN)</option>
                {indianVoices.map(v => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    🇮🇳 {v.name} ({v.lang})
                  </option>
                ))}
              </optgroup>

              {usVoices.length > 0 && (
                <optgroup label="🇺🇸 US English (en-US)">
                  <option value="auto:en-US">🇺🇸 Auto US English</option>
                  {usVoices.map(v => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      🇺🇸 {v.name} ({v.lang})
                    </option>
                  ))}
                </optgroup>
              )}

              {ukVoices.length > 0 && (
                <optgroup label="🇬🇧 UK English (en-GB)">
                  <option value="auto:en-GB">🇬🇧 Auto UK English</option>
                  {ukVoices.map(v => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      🇬🇧 {v.name} ({v.lang})
                    </option>
                  ))}
                </optgroup>
              )}

              {otherVoices.length > 0 && (
                <optgroup label="🌍 Other English Voices">
                  {otherVoices.map(v => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
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
                  borderRadius: 'var(--radius-sm)',
                  border: settings.wordsPerChunk === opt.val ? '1px solid var(--accent)' : '1px solid var(--border-main)',
                  backgroundColor: settings.wordsPerChunk === opt.val ? 'var(--color-amber-bg)' : 'var(--bg-muted)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  color: settings.wordsPerChunk === opt.val ? 'var(--color-amber)' : 'var(--text-secondary)'
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

        {/* Evaluation Mode: Relaxed vs Strict */}
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>
            Spelling & Punctuation Evaluation Mode
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleChange('evaluationMode', 'relaxed')}
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                border: (settings.evaluationMode || 'relaxed') === 'relaxed' ? '1.5px solid var(--color-green)' : '1px solid var(--border-main)',
                backgroundColor: (settings.evaluationMode || 'relaxed') === 'relaxed' ? 'var(--color-green-bg)' : 'var(--bg-muted)',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>🟢 Relaxed Mode</span>
                <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--color-green-bg)', padding: '1px 5px', borderRadius: '3px' }}>Recommended</span>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Focuses on spelling & listening. Ignores capitalization & punctuation errors.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleChange('evaluationMode', 'strict')}
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                border: settings.evaluationMode === 'strict' ? '1.5px solid var(--accent)' : '1px solid var(--border-main)',
                backgroundColor: settings.evaluationMode === 'strict' ? 'var(--color-amber-bg)' : 'var(--bg-muted)',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-amber)' }}>
                🎯 Strict Mode
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Requires exact spelling, capital letters, commas, and periods.
              </p>
            </button>
          </div>
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
                  borderRadius: 'var(--radius-sm)',
                  border: settings.repeatCount === num ? '1px solid var(--accent)' : '1px solid var(--border-main)',
                  backgroundColor: settings.repeatCount === num ? 'var(--color-amber-bg)' : 'var(--bg-muted)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: settings.repeatCount === num ? 'var(--color-amber)' : 'var(--text-secondary)'
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
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
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
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)'
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
