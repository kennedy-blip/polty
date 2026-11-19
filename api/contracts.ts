import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { ServiceContract, RegisterContractRequest } from '../src/types';

const contracts = new Map<string, ServiceContract>();

function seedContracts() {
  const seed: ServiceContract[] = [
    {
      id: 'payments-checkout-v2',
      name: 'Payments Checkout Service',
      version: '2.3.1',
      baselineSchema: {
        type: 'object',
        properties: {
          amount: { type: 'number', minimum: 0 },
          currency: { type: 'string', enum: ['USD', 'EUR', 'GBP'] },
          customerId: { type: 'string', format: 'uuid' },
          metadata: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              campaignId: { type: 'string' }
            },
            required: ['source']
          }
        },
        required: ['amount', 'currency', 'customerId']
      },
      candidateSchema: null,
      compatibilityVerdict: 'UNKNOWN',
      lastAuditTimestamp: null,
      consumerCount: 12
    },
    {
      id: 'agent-runs-stream',
      name: 'Agent Runs Streaming API',
      version: '1.0.4',
      baselineSchema: {
        type: 'object',
        properties: {
          runId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['pending', 'running', 'completed', 'failed'] },
          events: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                payload: { type: 'object' }
              },
              required: ['type', 'timestamp']
            }
          },
          retryAfter: { type: 'number', minimum: 0 }
        },
        required: ['runId', 'status', 'events']
      },
      candidateSchema: null,
      compatibilityVerdict: 'UNKNOWN',
      lastAuditTimestamp: null,
      consumerCount: 8
    },
    {
      id: 'auth-session-introspect',
      name: 'Auth Session Introspection',
      version: '3.2.0',
      baselineSchema: {
        type: 'object',
        properties: {
          active: { type: 'boolean' },
          scope: { type: 'string' },
          clientId: { type: 'string' },
          username: { type: 'string' },
          exp: { type: 'number' },
          iat: { type: 'number' },
          sub: { type: 'string' },
          aud: { type: 'array', items: { type: 'string' } }
        },
        required: ['active', 'scope', 'clientId', 'sub', 'exp']
      },
      candidateSchema: null,
      compatibilityVerdict: 'UNKNOWN',
      lastAuditTimestamp: null,
      consumerCount: 24
    }
  ];

  seed.forEach(c => contracts.set(c.id, c));
}

seedContracts();

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query, body } = req;

  if (method === 'GET') {
    const list = Array.from(contracts.values());
    return res.status(200).json(list);
  }

  if (method === 'POST') {
    const data = body as RegisterContractRequest;
    if (!data.id || !data.name || !data.version || !data.baselineSchema) {
      return res.status(400).json({ error: 'Missing required fields: id, name, version, baselineSchema' });
    }
    const contract: ServiceContract = {
      id: data.id,
      name: data.name,
      version: data.version,
      baselineSchema: data.baselineSchema,
      candidateSchema: null,
      compatibilityVerdict: 'UNKNOWN',
      lastAuditTimestamp: null,
      consumerCount: 0
    };
    contracts.set(data.id, contract);
    return res.status(201).json(contract);
  }

  if (method === 'DELETE') {
    const id = query.id as string;
    if (!id) {
      return res.status(400).json({ error: 'Missing contract id' });
    }
    const deleted = contracts.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    return res.status(204).send('');
  }

  return res.status(405).json({ error: 'Method not allowed' });
}