import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { AuditRequest, AuditResult, SchemaChange, SemVerBump, Severity } from '../src/types';

interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: any[];
  format?: string;
  minimum?: number;
  maximum?: number;
  [key: string]: any;
}

function getSchemaType(schema: JsonSchema): string {
  return schema.type || 'object';
}

function isRequiredField(schema: JsonSchema, fieldName: string): boolean {
  return schema.required?.includes(fieldName) ?? false;
}

function compareSchemas(
  baseline: JsonSchema,
  candidate: JsonSchema,
  path: string,
  strictMode: boolean,
  changes: SchemaChange[]
): void {
  const baseType = getSchemaType(baseline);
  const candType = getSchemaType(candidate);

  // Type changed
  if (baseType !== candType) {
    changes.push({
      path,
      severity: 'BREAKING',
      description: `Type changed from ${baseType} to ${candType} at '${path}'`,
      suggestedBump: 'major',
    });
    return;
  }

  // Handle objects
  if (baseType === 'object') {
    const baseProps = baseline.properties || {};
    const candProps = candidate.properties || {};
    const baseRequired = baseline.required || [];
    const candRequired = candidate.required || [];

    // Check for removed properties
    for (const key of Object.keys(baseProps)) {
      if (!(key in candProps)) {
        const severity = isRequiredField(baseline, key) ? 'BREAKING' : 'DEPRECATION';
        changes.push({
          path: `${path}.${key}`,
          severity,
          description: `${isRequiredField(baseline, key) ? 'Required' : 'Optional'} field '${key}' removed from '${path}'`,
          suggestedBump: severity === 'BREAKING' ? 'major' : 'minor',
        });
      }
    }

    // Check for added properties
    for (const key of Object.keys(candProps)) {
      if (!(key in baseProps)) {
        const isRequired = candRequired.includes(key);
        changes.push({
          path: `${path}.${key}`,
          severity: isRequired ? 'BREAKING' : 'NON_BREAKING',
          description: `${isRequired ? 'Required' : 'Optional'} field '${key}' added to '${path}'`,
          suggestedBump: isRequired ? 'major' : 'minor',
        });
      }
    }

    // Recurse into common properties
    for (const key of Object.keys(baseProps)) {
      if (key in candProps) {
        compareSchemas(baseProps[key], candProps[key], `${path}.${key}`, strictMode, changes);
      }
    }

    // Check for required field changes (field exists but required status changed)
    for (const key of baseRequired) {
      if (key in candProps && !candRequired.includes(key)) {
        changes.push({
          path: `${path}.${key}`,
          severity: 'BREAKING',
          description: `Required field '${key}' made optional at '${path}'`,
          suggestedBump: 'major',
        });
      }
    }
    for (const key of candRequired) {
      if (key in baseProps && !baseRequired.includes(key)) {
        changes.push({
          path: `${path}.${key}`,
          severity: 'BREAKING',
          description: `Optional field '${key}' made required at '${path}'`,
          suggestedBump: 'major',
        });
      }
    }
  }

  // Handle arrays
  if (baseType === 'array') {
    const baseItems = baseline.items;
    const candItems = candidate.items;

    if (baseItems && candItems) {
      compareSchemas(baseItems, candItems, `${path}[0]`, strictMode, changes);
    }

    // Check minItems/maxItems constraints
    if (baseline.minItems !== undefined && candidate.minItems !== undefined) {
      if (candidate.minItems > baseline.minItems) {
        changes.push({
          path,
          severity: 'BREAKING',
          description: `minItems increased from ${baseline.minItems} to ${candidate.minItems} at '${path}'`,
          suggestedBump: 'major',
        });
      }
    }
    if (baseline.maxItems !== undefined && candidate.maxItems !== undefined) {
      if (candidate.maxItems < baseline.maxItems) {
        changes.push({
          path,
          severity: 'BREAKING',
          description: `maxItems decreased from ${baseline.maxItems} to ${candidate.maxItems} at '${path}'`,
          suggestedBump: 'major',
        });
      }
    }
  }

  // Handle string constraints
  if (baseType === 'string') {
    const baseEnum = baseline.enum;
    const candEnum = candidate.enum;
    if (baseEnum && candEnum) {
      const removedEnums = baseEnum.filter((v: any) => !candEnum.includes(v));
      if (removedEnums.length > 0) {
        changes.push({
          path,
          severity: 'BREAKING',
          description: `Enum values removed: ${removedEnums.join(', ')} at '${path}'`,
          suggestedBump: 'major',
        });
      }
      const addedEnums = candEnum.filter((v: any) => !baseEnum.includes(v));
      if (addedEnums.length > 0) {
        changes.push({
          path,
          severity: 'NON_BREAKING',
          description: `Enum values added: ${addedEnums.join(', ')} at '${path}'`,
          suggestedBump: 'minor',
        });
      }
    }
    if (baseline.format && candidate.format && baseline.format !== candidate.format) {
      changes.push({
        path,
        severity: 'BREAKING',
        description: `Format changed from ${baseline.format} to ${candidate.format} at '${path}'`,
        suggestedBump: 'major',
      });
    }
  }

  // Handle number constraints
  if (baseType === 'number' || baseType === 'integer') {
    if (baseline.minimum !== undefined && candidate.minimum !== undefined) {
      if (candidate.minimum > baseline.minimum) {
        changes.push({
          path,
          severity: 'BREAKING',
          description: `Minimum value increased from ${baseline.minimum} to ${candidate.minimum} at '${path}'`,
          suggestedBump: 'major',
        });
      }
    }
    if (baseline.maximum !== undefined && candidate.maximum !== undefined) {
      if (candidate.maximum < baseline.maximum) {
        changes.push({
          path,
          severity: 'BREAKING',
          description: `Maximum value decreased from ${baseline.maximum} to ${candidate.maximum} at '${path}'`,
          suggestedBump: 'major',
        });
      }
    }
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
  compareSchemas(baselineSchema as any, candidateSchema as any, '$', strictMode, changes);

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