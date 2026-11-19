import React, { useState } from 'react';
import type { AuditResult, SchemaChange } from '../types';

export interface BreakingChangeReportProps {
  result: AuditResult | null;
}

export function BreakingChangeReport({ result }: BreakingChangeReportProps) {
  if (!result) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Run an audit to see breaking changes
      </div>
    );
  }

  const { changes, gateStatus, suggestedBump, timestamp } = result;

  const breaking = changes.filter(c => c.severity === 'BREAKING');
  const deprecation = changes.filter(c => c.severity === 'DEPRECATION');
  const nonBreaking = changes.filter(c => c.severity === 'NON_BREAKING');

  const severityColor = (s: string) => {
    switch (s) {
      case 'BREAKING': return 'text-rose-400';
      case 'DEPRECATION': return 'text-amber-400';
      case 'NON_BREAKING': return 'text-emerald-400';
      default: return 'text-muted-foreground';
    }
  };

  const bumpColor = (b: string) => {
    switch (b) {
      case 'major': return 'text-violet-400';
      case 'minor': return 'text-cyan-400';
      case 'patch': return 'text-emerald-400';
      default: return 'text-muted-foreground';
    }
  };

  const gateColor = gateStatus === 'PASS' ? 'text-emerald-400' : 'text-rose-400';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Breaking Change Report</h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${gateColor}`}>
            Gate: {gateStatus}
          </span>
          <span className={`text-xs font-medium ${bumpColor(suggestedBump)}`}>
            Bump: {suggestedBump.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {breaking.length > 0 && (
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-rose-400">BREAKING</span>
              <span className="text-xs text-muted-foreground">({breaking.length})</span>
            </div>
            <div className="space-y-1">
              {breaking.map((c, i) => (
                <div key={i} className="text-xs text-muted-foreground">
                  <span className="text-rose-400">{c.path}</span>: {c.description}
                </div>
              ))}
            </div>
          </div>
        )}

        {deprecation.length > 0 && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-amber-400">DEPRECATION</span>
              <span className="text-xs text-muted-foreground">({deprecation.length})</span>
            </div>
            <div className="space-y-1">
              {deprecation.map((c, i) => (
                <div key={i} className="text-xs text-muted-foreground">
                  <span className="text-amber-400">{c.path}</span>: {c.description}
                </div>
              ))}
            </div>
          </div>
        )}

        {nonBreaking.length > 0 && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-emerald-400">NON_BREAKING</span>
              <span className="text-xs text-muted-foreground">({nonBreaking.length})</span>
            </div>
            <div className="space-y-1">
              {nonBreaking.map((c, i) => (
                <div key={i} className="text-xs text-muted-foreground">
                  <span className="text-emerald-400">{c.path}</span>: {c.description}
                </div>
              ))}
            </div>
          </div>
        )}

        {changes.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No changes detected
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground mt-4">
        Last audit: {new Date(timestamp).toLocaleString()}
      </div>
    </div>
  );
}