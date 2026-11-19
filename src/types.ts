export type Severity = 'BREAKING' | 'DEPRECATION' | 'NON_BREAKING';
export type SemVerBump = 'major' | 'minor' | 'patch';
export type GateStatus = 'PASS' | 'BLOCK';

export interface SchemaChange {
  path: string;
  severity: Severity;
  description: string;
  suggestedBump: SemVerBump;
}

export interface AuditResult {
  contractId: string;
  changes: SchemaChange[];
  suggestedBump: SemVerBump;
  gateStatus: GateStatus;
  timestamp: string;
}

export interface ServiceContract {
  id: string;
  name: string;
  version: string;
  baselineSchema: object;
  candidateSchema: object | null;
  compatibilityVerdict: 'COMPATIBLE' | 'INCOMPATIBLE' | 'UNKNOWN';
  lastAuditTimestamp: string | null;
  consumerCount: number;
}

export interface RegisterContractRequest {
  id: string;
  name: string;
  version: string;
  baselineSchema: object;
}

export interface AuditRequest {
  contractId: string;
  baselineSchema: object;
  candidateSchema: object;
  strictMode?: boolean;
}