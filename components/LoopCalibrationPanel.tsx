// LoopCalibrationPanel - System tuning and configuration
import React, { useState } from 'react';
import type { CalibrationSettings } from '../types';

interface LoopCalibrationPanelProps {
  calibration: CalibrationSettings;
  onUpdateCalibration: (updates: Partial<CalibrationSettings>) => void;
}

export const LoopCalibrationPanel: React.FC<LoopCalibrationPanelProps> = ({
  calibration,
  onUpdateCalibration,
}) => {
  const [localSettings, setLocalSettings] = useState(calibration);

  const handleChange = (key: keyof CalibrationSettings, value: number | boolean | string) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onUpdateCalibration(localSettings);
  };

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(calibration);

  return (
    <div style={{
      background: '#1a1a2e',
      borderRadius: '12px',
      border: '1px solid #2d2d44',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #2d2d44',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: 600,
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>⚙️</span> Loop Calibration
        </h2>
        {hasChanges && (
          <span style={{
            fontSize: '10px',
            color: '#F59E0B',
            padding: '4px 8px',
            background: '#F59E0B20',
            borderRadius: '4px',
          }}>
            Unsaved changes
          </span>
        )}
      </div>

      <div style={{ padding: '16px' }}>
        {/* Sync Interval */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
            <span style={{ fontSize: '12px', color: '#D1D5DB' }}>
              Sync Interval
            </span>
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
              {localSettings.syncInterval}ms
            </span>
          </label>
          <input
            type="range"
            min={1000}
            max={30000}
            step={1000}
            value={localSettings.syncInterval}
            onChange={(e) => handleChange('syncInterval', parseInt(e.target.value))}
            style={{
              width: '100%',
              height: '4px',
              borderRadius: '2px',
              appearance: 'none',
              background: '#2d2d44',
              cursor: 'pointer',
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#6B7280',
            marginTop: '4px',
          }}>
            <span>1s (Fast)</span>
            <span>30s (Slow)</span>
          </div>
        </div>

        {/* Coherence Threshold */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
            <span style={{ fontSize: '12px', color: '#D1D5DB' }}>
              Coherence Threshold
            </span>
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
              {(localSettings.coherenceThreshold * 100).toFixed(0)}%
            </span>
          </label>
          <input
            type="range"
            min={0.5}
            max={1}
            step={0.05}
            value={localSettings.coherenceThreshold}
            onChange={(e) => handleChange('coherenceThreshold', parseFloat(e.target.value))}
            style={{
              width: '100%',
              height: '4px',
              borderRadius: '2px',
              appearance: 'none',
              background: '#2d2d44',
              cursor: 'pointer',
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#6B7280',
            marginTop: '4px',
          }}>
            <span>50% (Lenient)</span>
            <span>100% (Strict)</span>
          </div>
        </div>

        {/* Max Concurrent Tasks */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}>
            <span style={{ fontSize: '12px', color: '#D1D5DB' }}>
              Max Concurrent Tasks
            </span>
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
              {localSettings.maxConcurrentTasks}
            </span>
          </label>
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={localSettings.maxConcurrentTasks}
            onChange={(e) => handleChange('maxConcurrentTasks', parseInt(e.target.value))}
            style={{
              width: '100%',
              height: '4px',
              borderRadius: '2px',
              appearance: 'none',
              background: '#2d2d44',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Auto Reconnect Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '8px',
          marginBottom: '16px',
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#D1D5DB' }}>
              Auto Reconnect
            </div>
            <div style={{ fontSize: '10px', color: '#6B7280' }}>
              Automatically reconnect disconnected agents
            </div>
          </div>
          <button
            onClick={() => handleChange('autoReconnect', !localSettings.autoReconnect)}
            style={{
              width: '48px',
              height: '24px',
              borderRadius: '12px',
              background: localSettings.autoReconnect ? '#10B981' : '#4B5563',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#FFFFFF',
              position: 'absolute',
              top: '2px',
              left: localSettings.autoReconnect ? '26px' : '2px',
              transition: 'left 0.2s',
            }} />
          </button>
        </div>

        {/* Log Level */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            fontSize: '12px',
            color: '#D1D5DB',
            marginBottom: '8px',
          }}>
            Log Level
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['debug', 'info', 'warning', 'error'] as const).map((level) => (
              <button
                key={level}
                onClick={() => handleChange('logLevel', level)}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: localSettings.logLevel === level
                    ? '#3B82F620'
                    : 'rgba(0, 0, 0, 0.2)',
                  border: `1px solid ${localSettings.logLevel === level ? '#3B82F6' : '#2d2d44'}`,
                  borderRadius: '6px',
                  color: localSettings.logLevel === level ? '#3B82F6' : '#9CA3AF',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s',
                }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApply}
          disabled={!hasChanges}
          style={{
            width: '100%',
            padding: '12px',
            background: hasChanges
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : '#4B5563',
            border: 'none',
            borderRadius: '8px',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 500,
            cursor: hasChanges ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          Apply Calibration
        </button>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #667eea;
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #667eea;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default LoopCalibrationPanel;
