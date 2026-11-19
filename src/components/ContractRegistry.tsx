import React, { useEffect, useState } from 'react';
import type { ServiceContract } from '../types';

export interface ContractRegistryProps {
  onLoadContract: (contract: ServiceContract) => void;
}

export function ContractRegistry({ onLoadContract }: ContractRegistryProps) {
  const [contracts, setContracts] = useState<ServiceContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContracts() {
      try {
        setLoading(true);
        const res = await fetch('/api/contracts');
        if (!res.ok) throw new Error('Failed to fetch contracts');
        const data = await res.json();
        setContracts(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchContracts();
  }, []);

  const handleLoad = (contract: ServiceContract) => {
    onLoadContract(contract);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading contracts…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-error">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted-foreground">Service Contract Catalog</h3>
        <button
          onClick={() => window.location.href = '/api/contracts'}
          className="text-xs text-cyan-400 hover:text-cyan-300 underline"
        >
          View Raw
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {contracts.map((c) => (
          <div
            key={c.id}
            className="group rounded-lg border border-[1e293b] bg-[0f172a] p-3 hover:shadow-lg hover:shadow-[0_0_0_0_1e293b]/20 transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-cyan-400">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.id}</span>
              </div>
              <span className="text-xs text-emerald-400">{c.version}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.name}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-amber-400">Consumers: {c.consumerCount}</span>
              <button
                onClick={() => handleLoad(c)}
                className="text-xs text-violet-400 hover:text-violet-300 underline"
              >
                Load
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}