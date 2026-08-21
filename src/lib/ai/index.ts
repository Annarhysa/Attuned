import { AIProvider } from './provider';
import { LocalHeuristicProvider } from './localProvider';
import { buildAnthropicProvider, buildOpenAIProvider } from './remoteProviderStub';

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const choice = (process.env.AI_PROVIDER || 'local').toLowerCase();
  if (choice === 'openai') cached = buildOpenAIProvider();
  else if (choice === 'anthropic') cached = buildAnthropicProvider();
  else cached = new LocalHeuristicProvider();
  return cached;
}

export type { AIProvider } from './provider';
