import axios from 'axios';
import { ApiConfigStorage } from '../storage/apiConfigStorage';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatModel {
  id: string;
  name: string;
  provider: string;
  description?: string;
}

export interface SendMessageRequest {
  message: string;
  model: string;
  history: ChatMessage[];
  userId?: string;
}

export interface SendMessageResponse {
  content: string;
  model: string;
}

export class ChatService {
  private apiConfigStorage: ApiConfigStorage;

  constructor() {
    this.apiConfigStorage = new ApiConfigStorage();
  }

  // 发送消息
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    const { message, model, history, userId } = request;

    // 获取用户的API配置
    const configs = await this.apiConfigStorage.getConfigsByUserId(userId!);
    
    // 查找支持该模型的配置
    const config = configs.find(c => c.models.includes(model));
    
    if (!config) {
      throw new Error(`未找到支持模型 ${model} 的API配置`);
    }

    try {
      // 构建消息历史
      const messages: ChatMessage[] = [
        ...history.slice(-10), // 只保留最近10条消息
        { role: 'user', content: message }
      ];

      // 调用外部API
      const response = await axios.post(
        `${config.baseUrl}/chat/completions`,
        {
          model: model,
          messages: messages,
          max_tokens: 2000,
          temperature: 0.7,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const assistantMessage = response.data.choices[0]?.message?.content;
      
      if (!assistantMessage) {
        throw new Error('API返回的响应格式不正确');
      }

      return {
        content: assistantMessage,
        model: model
      };
    } catch (error) {
      console.error('Chat API error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('API密钥无效或已过期');
        } else if (error.response?.status === 429) {
          throw new Error('API调用频率超限，请稍后重试');
        } else if (error.response?.status === 400) {
          throw new Error('请求参数错误：' + (error.response.data?.error?.message || '未知错误'));
        }
      }
      
      throw new Error('调用AI服务失败，请检查网络连接和API配置');
    }
  }

  // 获取可用模型列表
  async getAvailableModels(userId: string): Promise<ChatModel[]> {
    const configs = await this.apiConfigStorage.getConfigsByUserId(userId);
    
    const models: ChatModel[] = [];
    
    // 从所有配置中收集模型
    configs.forEach(config => {
      config.models.forEach(modelId => {
        // 避免重复模型
        if (!models.find(m => m.id === modelId)) {
          models.push({
            id: modelId,
            name: this.getModelDisplayName(modelId),
            provider: this.getProviderFromUrl(config.baseUrl),
            description: this.getModelDescription(modelId)
          });
        }
      });
    });

    // 如果没有配置，返回默认模型列表
    if (models.length === 0) {
      return this.getDefaultModels();
    }

    return models;
  }

  // 获取模型显示名称
  private getModelDisplayName(modelId: string): string {
    const modelNames: { [key: string]: string } = {
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'gpt-4': 'GPT-4',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-4o': 'GPT-4o',
      'claude-3-haiku': 'Claude 3 Haiku',
      'claude-3-sonnet': 'Claude 3 Sonnet',
      'claude-3-opus': 'Claude 3 Opus',
      'gemini-pro': 'Gemini Pro',
      'llama-2-70b': 'Llama 2 70B',
      'mixtral-8x7b': 'Mixtral 8x7B',
      'moonshot-v1-8k': 'Kimi 8K',
      'moonshot-v1-32k': 'Kimi 32K',
      'moonshot-v1-128k': 'Kimi 128K'
    };
    
    return modelNames[modelId] || modelId;
  }

  // 从URL获取提供商名称
  private getProviderFromUrl(baseUrl: string): string {
    if (baseUrl.includes('openai.com')) return 'OpenAI';
    if (baseUrl.includes('anthropic.com')) return 'Anthropic';
    if (baseUrl.includes('google.com') || baseUrl.includes('googleapis.com')) return 'Google';
    if (baseUrl.includes('huggingface.co')) return 'Hugging Face';
    if (baseUrl.includes('together.ai')) return 'Together AI';
    if (baseUrl.includes('replicate.com')) return 'Replicate';
    
    // 尝试从域名提取
    try {
      const url = new URL(baseUrl);
      const hostname = url.hostname;
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        return parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1);
      }
    } catch (e) {
      // 忽略URL解析错误
    }
    
    return '自定义';
  }

  // 获取模型描述
  private getModelDescription(modelId: string): string {
    const descriptions: { [key: string]: string } = {
      'gpt-3.5-turbo': '快速、经济的对话模型',
      'gpt-4': '更强大的推理能力',
      'gpt-4-turbo': '更快的GPT-4版本',
      'gpt-4o': '最新的多模态模型',
      'claude-3-haiku': '快速、轻量级的模型',
      'claude-3-sonnet': '平衡性能和速度',
      'claude-3-opus': '最强大的推理能力',
      'gemini-pro': 'Google的先进模型',
      'llama-2-70b': '开源大语言模型',
      'mixtral-8x7b': '高效的混合专家模型',
      'moonshot-v1-8k': 'Kimi 8K上下文模型',
      'moonshot-v1-32k': 'Kimi 32K上下文模型',
      'moonshot-v1-128k': 'Kimi 128K上下文模型'
    };
    
    return descriptions[modelId] || '自定义模型';
  }

  // 获取默认模型列表（当用户没有配置时）
  private getDefaultModels(): ChatModel[] {
    return [
      {
        id: 'demo-model',
        name: '演示模型',
        provider: '系统',
        description: '请在设置中配置您的API以使用真实的AI模型'
      }
    ];
  }

  // 测试API配置
  async testApiConfig(config: {
    baseUrl: string;
    apiKey: string;
    model: string;
  }): Promise<boolean> {
    try {
      const response = await axios.post(
        `${config.baseUrl}/chat/completions`,
        {
          model: config.model,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      return response.status === 200;
    } catch (error) {
      console.error('API config test failed:', error);
      return false;
    }
  }
}