import { FrontendAction } from '../types/frontend-action.js';
import { Parameter } from '@copilotkit/shared';
import 'react';

declare function useCopilotAction<const T extends Parameter[] | [] = []>(action: FrontendAction<T>, dependencies?: any[]): void;

export { useCopilotAction };
