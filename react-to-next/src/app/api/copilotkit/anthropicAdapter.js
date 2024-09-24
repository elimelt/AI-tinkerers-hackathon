import { CopilotRuntime, AnthropicAdapter } from '@copilotkit/runtime';
import Anthropic from '@anthropic-ai/sdk';

const copilotKit = new CopilotRuntime();

const anthropic = new Anthropic({
  apiKey: '<your-api-key>',
});

const serviceAdapter = new AnthropicAdapter({ anthropic });

return copilotKit.streamHttpServerResponse(req, res, serviceAdapter);
