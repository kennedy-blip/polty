import React, { useState } from 'react';
import type { AuditResult } from '../types';

export interface SchemaDiffEditorProps {
  baselineSchema: object;
  candidateSchema: object | null;
  onAudit: (result: AuditResult) => void;
}

type MutationType = 'remove-required' | 'narrow-type' | 'add-optional';

export function SchemaDiffEditor({ baselineSchema, candidateSchema, onAudit }: SchemaDiffEditorProps) {
  const [candidate, setCandidate] = useState<string>(candidateSchema ? JSON.stringify(candidateSchema, null, 2) : '{}');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const parsed = JSON.parse(candidate);
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: 'temp-id',
          baselineSchema,
          candidateSchema: parsed,
          strictMode: true,
        }),
      });
      if (!res.ok) throw new Error('Audit failed');
      const result = await res.json();
      onAudit(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const applyMutation = (mutation: MutationType) => {
    try {
      const parsed = JSON.parse(candidate);
      const next = JSON.parse(JSON.stringify(parsed));

      if (mutation === 'remove-required') {
        if (Array.isArray(next.required) && next.required.length > 0) {
          const fieldToRemove = next.required[0];
          delete next.required;
          delete next.properties?.[fieldToRemove];
        }
      }

      if (mutation === 'narrow-type') {
        const stringProps = Object.entries(next.properties || {}).filter(
          ([, v]: any) => v?.type === 'string'
        );
        if (stringProps.length > 0) {
          const [field] = stringProps[0];
          next.properties[field].type = 'number';
        }
      }

      if (mutation === 'add-optional') {
        next.properties = next.properties || {};
        next.properties['optionalNewField'] = { type: 'string', description: 'Optional new field added' };
      }

      setCandidate(JSON.stringify(next, null, 2));
    } catch (e: any) {
      setError('Mutation failed: ' + e.message);
    }
  };

  const mutationButtons: { label: string; mutation: MutationType }[] = [
    { label: 'Remove Required Field', mutation: 'remove-required' },
    { label: 'Narrow Type String->Number', mutation: 'narrow-type' },
    { label: 'Add Optional Field', mutation: 'add-optional' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Baseline vs Candidate Schema</h3>
        <button
          onClick={handleAudit}
          disabled={loading}
          className="px-3 py-1 text-xs bg-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/30 disabled:opacity-50"
        >
          {loading ? 'Auditing…' : 'Run Audit'}
        </button>
      </div>

      {error && (
        <div className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">Baseline Schema</div>
          <pre className="bg-[0f172a] border border-[1e293b] rounded p-3 text-xs font-mono overflow-auto max-h-64">
            {JSON.stringify(baselineSchema, null, 2)}
          </pre>
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">Candidate Schema</div>
          <textarea
            value={candidate}
            onChange={(e) => setCandidate(e.target.value)}
            className="w-full h-32 bg-[0f172a] border border-[1e293b] rounded p-3 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            placeholder="Paste candidate JSON schema here..."
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {mutationButtons.map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            className="text-xs px-2 py-1 bg-[0f172a] border border-[1e293b] rounded text-cyan-400 hover:bg-cyan-500/20"
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}