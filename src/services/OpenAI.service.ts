import env from 'env-var';
import OpenAI from 'openai';

import { getConfig } from '../domain/Config.js';
import { Service } from '../domain/Service.js';

import { Logger } from '../Logger.js';

export class OpenAIService extends Service {
    private client!: OpenAI;

    constructor() {
        super('openai');
    }

    public static makeClient(): OpenAI {
        return new OpenAI({
            apiKey: env.get('OPENAI_API_KEY').required().asString(),
            organization: env.get('OPENAI_ORG').asString(),
            project: env.get('OPENAI_PROJECT').asString(),
        });
    }

    async initialize(): Promise<void> {
        Logger.debug('Initializing OpenAI service');
        this.client = OpenAIService.makeClient();
    }

    async destroy(): Promise<void> {}

    // Completions

    /**
     * Complete a message from a model
     * @param messages Messages to send to the model
     * @param tools Tools that can be called by the model
     * @param tool_choice Whether to choose between calling tools or generating a message.
     *                    Can also force the model to call at least one tool
     *                    (default: 'auto')
     * @returns The completion of the message
     */
    async completion(
        messages: OpenAI.ChatCompletionMessageParam[],
        tools?: OpenAI.ChatCompletionTool[],
        tool_choice?: OpenAI.ChatCompletionToolChoiceOption
    ): Promise<OpenAI.ChatCompletion> {
        const config = getConfig();

        return this.client.chat.completions.create({
            model: config.api.model,
            messages,
            tools,
            tool_choice,
            max_tokens: config.api.max_tokens,
            temperature: config.fine_tuning.temperature,
        });
    }
}
