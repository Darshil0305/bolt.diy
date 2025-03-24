import { BaseProvider } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModelV1 } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export default class OpenAIProvider extends BaseProvider {
  name = 'PawanChatGPT';
  getApiKeyLink = 'https://pawan.krd/api-access';

  config = {
    apiTokenKey: 'PAWAN_API_KEY', // Updated key
  };

  staticModels: ModelInfo[] = [
    { name: 'gpt-4o', label: 'GPT-4o', provider: 'PawanChatGPT', maxTokenAllowed: 8000 },
    { name: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'PawanChatGPT', maxTokenAllowed: 8000 },
    { name: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'PawanChatGPT', maxTokenAllowed: 8000 },
    { name: 'gpt-4', label: 'GPT-4', provider: 'PawanChatGPT', maxTokenAllowed: 8000 },
    { name: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'PawanChatGPT', maxTokenAllowed: 8000 },
  ];

  async getDynamicModels(
    apiKeys?: Record<string, string>,
    settings?: IProviderSetting,
    serverEnv?: Record<string, string>,
  ): Promise<ModelInfo[]> {
    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: settings,
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'PAWAN_API_KEY',
    });

    if (!apiKey) {
      throw `Missing API Key configuration for ${this.name} provider`;
    }

    // Fetch available models from PawanOsman's API
    const response = await fetch(`https://api.pawan.krd/v1/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
    });

    const res = await response.json();
    const staticModelIds = this.staticModels.map((m) => m.name);

    // Filter out models that match predefined ones
    const data = res.data.filter(
      (model: any) =>
        model.object === 'model' &&
        (model.id.startsWith('gpt-') || model.id.startsWith('o') || model.id.startsWith('chatgpt-')) &&
        !staticModelIds.includes(model.id),
    );

    return data.map((m: any) => ({
      name: m.id,
      label: `${m.id}`,
      provider: this.name,
      maxTokenAllowed: m.context_window || 32000,
    }));
  }

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModelV1 {
    const { model, serverEnv, apiKeys, providerSettings } = options;

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: serverEnv as any,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'PAWAN_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API key for ${this.name} provider`);
    }

    // Replace OpenAI SDK with direct fetch request to Pawan API
    const chatCompletion = async (messages: { role: 'system' | 'user'; content: string }[]) => {
      try {
        const response = await fetch('https://api.pawan.krd/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 256,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
          }),
        });

        const completion = await response.json();
        console.log(completion.choices[0].message.content);
        return completion;
      } catch (error) {
        console.error('Error calling PawanChatGPT API:', error);
        throw error;
      }
    };

    // Return both the chat completion function and the model instance
    return {
      chatCompletion,
    };
  }
}
