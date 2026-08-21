import { AIProvider } from './provider';
import { LocalHeuristicProvider } from './localProvider';

/**
 * Placeholder for real LLM-backed providers. Both OpenAI and Anthropic
 * providers implement the same `AIProvider` interface as the local engine --
 * swapping `AI_PROVIDER` in .env is the only change needed once a real key
 * and prompt/schema implementation are wired in here. For now they delegate
 * to the local heuristic engine so the app keeps working without a key.
 */
function buildRemoteStub(name: string, envKey: string): AIProvider {
  const local = new LocalHeuristicProvider();
  const hasKey = !!process.env[envKey];
  if (!hasKey) {
    // eslint-disable-next-line no-console
    console.warn(`[ai] AI_PROVIDER=${name} but ${envKey} is not set -- falling back to local heuristic engine.`);
  }
  return {
    name: hasKey ? name : `${name}-fallback-local`,
    analyzeJob: (...args) => local.analyzeJob(...args),
    matchProfileToJob: (...args) => local.matchProfileToJob(...args),
    generateCoverLetter: (...args) => local.generateCoverLetter(...args),
    tailorResume: (...args) => local.tailorResume(...args),
    recommendDesign: (...args) => local.recommendDesign(...args),
  };
}

export function buildOpenAIProvider(): AIProvider {
  return buildRemoteStub('openai', 'OPENAI_API_KEY');
}

export function buildAnthropicProvider(): AIProvider {
  return buildRemoteStub('anthropic', 'ANTHROPIC_API_KEY');
}
