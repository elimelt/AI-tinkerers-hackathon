import { Message } from '@copilotkit/runtime-client-gql';
import { SystemMessageFunction } from '../types/system-message.js';

interface UseCopilotChatOptions {
    /**
     * A unique identifier for the chat. If not provided, a random one will be
     * generated. When provided, the `useChat` hook with the same `id` will
     * have shared states across components.
     */
    id?: string;
    /**
     * HTTP headers to be sent with the API request.
     */
    headers?: Record<string, string> | Headers;
    /**
     * System messages of the chat. Defaults to an empty array.
     */
    initialMessages?: Message[];
    /**
     * A function to generate the system message. Defaults to `defaultSystemMessage`.
     */
    makeSystemMessage?: SystemMessageFunction;
}
interface UseCopilotChatReturn {
    visibleMessages: Message[];
    appendMessage: (message: Message) => Promise<void>;
    setMessages: (messages: Message[]) => void;
    deleteMessage: (messageId: string) => void;
    reloadMessages: () => Promise<void>;
    stopGeneration: () => void;
    isLoading: boolean;
}
declare function useCopilotChat({ makeSystemMessage, ...options }?: UseCopilotChatOptions): UseCopilotChatReturn;
declare function defaultSystemMessage(contextString: string, additionalInstructions?: string): string;

export { UseCopilotChatOptions, UseCopilotChatReturn, defaultSystemMessage, useCopilotChat };
