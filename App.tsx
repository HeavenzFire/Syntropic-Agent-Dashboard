// App.tsx - Syntropic Agent Dashboard Main Application
import React from 'react';
import { useAgentHub } from './hooks/useAgentHub';
import { Header } from './components/Header';
import { NetworkVisualizer } from './components/NetworkVisualizer';
import { SystemIntegrationPanel } from './components/SystemIntegrationPanel';
import { DragonDeploymentPanel } from './components/DragonDeploymentPanel';
import { MissionLog } from './components/MissionLog';
import { LoopCalibrationPanel } from './components/LoopCalibrationPanel';

const App: React.FC = () => {
  const {
    agents,
    tasks,
    logs,
    metrics,
    calibration,
    connections,
    selectedAgent,
    isLoading,
    selectAgent,
    updateAgentStatus,
    createTask,
    updateTask,
    completeTask,
    updateCalibration,
    braidInvoke,
  } = useAgentHub();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f0f1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          textAlign: 'center',
          color: '#FFFFFF',
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
            animation: 'pulse 2s infinite',
          }}>
            ⚡
          </div>
          <div style={{ fontSize: '14px', color: '#9CA3AF' }}>
            Initializing Syntropic Agent Hub...
          </div>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.95); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f1a',
      color: '#FFFFFF',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    }}>
      {/* Header with metrics */}
      <Header metrics={metrics} />

      {/* Main content */}
      <div style={{
        padding: '24px',
        display: 'grid',
        gridTemplateColumns: '1fr 350px',
        gridTemplateRows: 'auto 1fr',
        gap: '24px',
        maxWidth: '1800px',
        margin: '0 auto',
      }}>
        {/* Network Visualizer - Main area */}
        <div style={{
          gridColumn: '1',
          gridRow: '1 / 3',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}>
          {/* Network visualization */}
          <div style={{ height: '450px' }}>
            <NetworkVisualizer
              agents={agents}
              connections={connections}
              selectedAgentId={selectedAgent?.id ?? null}
              onSelectAgent={selectAgent}
            />
          </div>

          {/* Dragon Deployment Panel */}
          <DragonDeploymentPanel
            agents={agents}
            tasks={tasks}
            onCreateTask={createTask}
            onUpdateTask={updateTask}
            onCompleteTask={completeTask}
            onBraidInvoke={braidInvoke}
          />
        </div>

        {/* Right sidebar */}
        <div style={{
          gridColumn: '2',
          gridRow: '1 / 3',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}>
          {/* Agent Registry */}
          <SystemIntegrationPanel
            agents={agents}
            selectedAgent={selectedAgent}
            onSelectAgent={selectAgent}
            onUpdateStatus={updateAgentStatus}
          />

          {/* Calibration Panel */}
          <LoopCalibrationPanel
            calibration={calibration}
            onUpdateCalibration={updateCalibration}
          />

          {/* Mission Log */}
          <div style={{ flex: 1, minHeight: '250px' }}>
            <MissionLog logs={logs} />
          </div>
        </div>
      </div>

      {/* Global styles */}
      <style>{`
        * {
          box-sizing: border-box;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #1a1a2e;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: #2d2d44;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #3d3d54;
        }

        ::selection {
          background: #667eea40;
          color: #FFFFFF;
        }

        @media (max-width: 1200px) {
          .main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
