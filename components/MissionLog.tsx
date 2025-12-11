// MissionLog - Activity log and event timeline
import React, { useRef, useEffect } from 'react';
import type { LogEntry } from '../types';

interface MissionLogProps {
  logs: LogEntry[];
}

export const MissionLog: React.FC<MissionLogProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLevelColor = (level: LogEntry['level']): string => {
    switch (level) {
      case 'success': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      default: return '#3B82F6';
    }
  };

  const getLevelIcon = (level: LogEntry['level']): string => {
    switch (level) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✗';
      default: return '●';
    }
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div style={{
      background: '#1a1a2e',
      borderRadius: '12px',
      border: '1px solid #2d2d44',
      overflow: 'hidden',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
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
          <span>📜</span> Mission Log
        </h2>
        <span style={{
          fontSize: '12px',
          color: '#9CA3AF',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '4px 8px',
          borderRadius: '4px',
        }}>
          {logs.length} entries
        </span>
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px',
        }}
      >
        {logs.length === 0 ? (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            color: '#6B7280',
            fontSize: '12px',
          }}>
            No activity yet
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '8px 12px',
                borderRadius: '6px',
                marginBottom: '4px',
                background: 'rgba(0, 0, 0, 0.2)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)';
              }}
            >
              {/* Level indicator */}
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: `${getLevelColor(log.level)}20`,
                color: getLevelColor(log.level),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                flexShrink: 0,
              }}>
                {getLevelIcon(log.level)}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '2px',
                }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: getLevelColor(log.level),
                  }}>
                    {log.source}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    color: '#6B7280',
                  }}>
                    {formatTime(log.timestamp)}
                  </span>
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '12px',
                  color: '#D1D5DB',
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                }}>
                  {log.message}
                </p>
                {log.details && (
                  <pre style={{
                    margin: '4px 0 0 0',
                    padding: '6px 8px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: '#9CA3AF',
                    overflow: 'auto',
                    fontFamily: 'monospace',
                  }}>
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Status bar */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid #2d2d44',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '10px',
        color: '#6B7280',
      }}>
        <span>
          {logs.filter(l => l.level === 'error').length} errors •{' '}
          {logs.filter(l => l.level === 'warning').length} warnings
        </span>
        <span>
          Last update: {logs.length > 0 ? formatTime(logs[logs.length - 1].timestamp) : '--:--:--'}
        </span>
      </div>
    </div>
  );
};

export default MissionLog;
