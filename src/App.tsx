import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { PolicyHeader } from './components/PolicyHeader';
import { SchemaDiffEditor } from './components/SchemaDiffEditor';
import { BreakingChangeReport } from './components/BreakingChangeReport';
import { ContractRegistry } from './components/ContractRegistry';
import type { ServiceContract } from './types';

function App() {
  const navigate = useNavigate();
  const [auditResult, setAuditResult] = useState<any>(null);
  const [selectedContract, setSelectedContract] = useState<ServiceContract | null>(null);
  const [gateStatus, setGateStatus] = useState<'PASS' | 'BLOCK' | null>(null);

  const handleLoadContract = (contract: ServiceContract) => {
    setSelectedContract(contract);
    navigate('/editor');
  };

  const handleAuditResult = (result: any) => {
    setAuditResult(result);
    setGateStatus(result.gateStatus);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[070a12] text-white">
        <PolicyHeader
          gateStatus={gateStatus}
          onNewContract={() => navigate('/registry')}
          onRunAudit={() => navigate('/editor')}
        />

        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route
              path="/registry"
              element={
                <ContractRegistry onLoadContract={handleLoadContract} />
              }
            />
            <Route
              path="/editor"
              element={
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Schema Diff Editor</h2>
                    <button
                      onClick={() => navigate('/registry')}
                      className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                    >
                      Browse Contracts
                    </button>
                  </div>
                  <SchemaDiffEditor
                    baselineSchema={selectedContract?.baselineSchema || {}}
                    candidateSchema={selectedContract?.candidateSchema || null}
                    onAudit={handleAuditResult}
                  />
                  <BreakingChangeReport result={auditResult} />
                </div>
              }
            />
            <Route
              path="/"
              element={
                <div className="text-center py-20">
                  <h1 className="text-2xl font-bold text-white mb-4">PolicyPulse</h1>
                  <p className="text-muted-foreground mb-6">API Contract Verifier & Release Policy Gate</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => navigate('/registry')}
                      className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/30 transition-colors"
                    >
                      View Contract Registry
                    </button>
                    <button
                      onClick={() => navigate('/editor')}
                      className="px-4 py-2 bg-violet-500/20 text-violet-400 rounded hover:bg-violet-500/30 transition-colors"
                    >
                      Open Schema Editor
                    </button>
                  </div>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;