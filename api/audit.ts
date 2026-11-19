import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { AuditRequest, AuditResult, SchemaChange, SemVerBump, Severity } from '../src/types';

function getPrimitiveType(value: any): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function compareSchemas(
  baseline: any,
  candidate: any,
  path: string,
  strictMode: boolean,
  changes: SchemaChange[]
): void {
  if (baseline === undefined && candidate === undefined) return;

  // Field removed
  if (baseline !== undefined && candidate === undefined) {
    changes.push({
      path,
      severity: 'BREAKING',
      description: `Field '${path}' removed from schema`,
      suggestedBump: 'major',
    });
    return;
  }

  // Field added
  if (baseline === undefined && candidate !== undefined) {
    changes.push({
      path,
      severity: 'NON_BREAKING',
      description: `Field '${path}' added to schema`,
      suggestedBump: 'minor',
    });
    return;
  }

  // Both exist — compare types
  const baselineType = getPrimitiveType(baseline);
  const candidateType = getPrimitiveType(candidate);

  if (baselineType !== candidateType) {
    changes.push({
      path,
      severity: 'BREAKING',
      description: `Type changed from ${baselineType} to ${candidateType} at '${path}'`,
      suggestedBump: 'major',
    });
    return;
  }

  // Both are objects — recurse
  if (baselineType === 'object' && candidateType === 'object') {
    const baseKeys = Object.keys(baseline);
    const candKeys = Object.keys(candidate);

    // Check for removed keys
    for (const key of baseKeys) {
      if (!candKeys.includes(key)) {
        changes.push({
          path: `${path}.${key}`,
          severity: 'BREAKING',
          description: `Required field '${key}' removed from '${path}'`,
          suggestedBump: 'major',
        });
      }
    }

    // Check for added keys
    for (const key of candKeys) {
      if (!baseKeys.includes(key)) {
        changes.push({
          path: `${path}.${key}`,
          severity: 'NON_BREAKING',
          description: `Optional field '${key}' added to '${path}'`,
          suggestedBump: 'minor',
        });
      }
    }

    // Recurse into common keys
    for (const key of baseKeys) {
      if (candKeys.includes(key)) {
        compareSchemas(baseline[key], candidate[key], `${path}.${key}`, strictMode, changes);
      }
    }
  }

  // Both are arrays — compare items
  if (baselineType === 'array' && candidateType === 'array') {
    const baseItems = baseline;
    const candItems = candidate;

    if (baseItems.length > 0 && candItems.length > 0) {
      compareSchemas(baseItems[0], candItems[0], `${path}[0]`, strictMode, changes);
    }

    if (candItems.length < baseItems.length) {
      changes.push({
        path,
        severity: 'BREAKING',
        description: `Array length reduced from ${baseItems.length} to ${candItems.length} at '${path}'`,
        suggestedBump: 'major',
      });
    }
  }

  // Primitive type mismatch (string -> number, etc.)
  if (baselineType !== 'object' && baselineType !== 'array' && baselineType !== candidateType) {
    changes.push({
      path,
      severity: 'BREAKING',
      description: `Type narrowed from ${baselineType} to ${candidateType} at '${path}'`,
      suggestedBump: 'major',
    });
  }
}

function calculateSuggestedBump(changes: SchemaChange[]): SemVerBump {
  if (changes.some(c => c.suggestedBump === 'major')) return 'major';
  if (changes.some(c => c.suggestedBump === 'minor')) return 'minor';
  return 'patch';
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contractId, baselineSchema, candidateSchema, strictMode = false } = req.body as AuditRequest;

  if (!contractId || !baselineSchema || !candidateSchema) {
    return res.status(400).json({ error: 'Missing required fields: contractId, baselineSchema, candidateSchema' });
  }

  const changes: SchemaChange[] = [];
  compareSchemas(baselineSchema, candidateSchema, '$', strictMode, changes);

  const suggestedBump = calculateSuggestedBump(changes);
  const gateStatus = changes.some(c => c.severity === 'BREAKING') ? 'BLOCK' : 'PASS';

  const result: AuditResult = {
    contractId,
    changes,
    suggestedBump,
    gateStatus,
    timestamp: new Date().toISOString(),
  };

  return res.status(200).json(result);
}