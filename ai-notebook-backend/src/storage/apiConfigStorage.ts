import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ApiConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  models: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ApiConfigStorage {
  private dataDir: string;
  private configsFile: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.configsFile = path.join(this.dataDir, 'api-configs.json');
    this.ensureDataDir();
  }

  // 确保数据目录存在
  private async ensureDataDir(): Promise<void> {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  // 读取所有配置
  private async readConfigs(): Promise<ApiConfig[]> {
    try {
      const data = await fs.readFile(this.configsFile, 'utf-8');
      const configs = JSON.parse(data);
      
      // 转换日期字符串为Date对象
      return configs.map((config: any) => ({
        ...config,
        createdAt: new Date(config.createdAt),
        updatedAt: new Date(config.updatedAt)
      }));
    } catch (error) {
      // 文件不存在或格式错误，返回空数组
      return [];
    }
  }

  // 写入所有配置
  private async writeConfigs(configs: ApiConfig[]): Promise<void> {
    await this.ensureDataDir();
    await fs.writeFile(this.configsFile, JSON.stringify(configs, null, 2), 'utf-8');
  }

  // 根据用户ID获取配置列表
  async getConfigsByUserId(userId: string): Promise<ApiConfig[]> {
    const allConfigs = await this.readConfigs();
    return allConfigs.filter(config => config.userId === userId);
  }

  // 根据ID获取单个配置
  async getConfigById(id: string, userId?: string): Promise<ApiConfig | null> {
    const allConfigs = await this.readConfigs();
    const config = allConfigs.find(c => c.id === id);
    
    if (!config) {
      return null;
    }
    
    // 如果指定了用户ID，检查权限
    if (userId && config.userId !== userId) {
      return null;
    }
    
    return config;
  }

  // 创建新配置
  async createConfig(configData: Omit<ApiConfig, 'id'>): Promise<ApiConfig> {
    const allConfigs = await this.readConfigs();
    
    const newConfig: ApiConfig = {
      id: uuidv4(),
      ...configData
    };
    
    allConfigs.push(newConfig);
    await this.writeConfigs(allConfigs);
    
    return newConfig;
  }

  // 更新配置
  async updateConfig(
    id: string, 
    updates: Partial<Omit<ApiConfig, 'id' | 'userId' | 'createdAt'>>,
    userId: string
  ): Promise<ApiConfig | null> {
    const allConfigs = await this.readConfigs();
    const configIndex = allConfigs.findIndex(c => c.id === id && c.userId === userId);
    
    if (configIndex === -1) {
      return null;
    }
    
    const updatedConfig = {
      ...allConfigs[configIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    allConfigs[configIndex] = updatedConfig;
    await this.writeConfigs(allConfigs);
    
    return updatedConfig;
  }

  // 删除配置
  async deleteConfig(id: string, userId: string): Promise<boolean> {
    const allConfigs = await this.readConfigs();
    const configIndex = allConfigs.findIndex(c => c.id === id && c.userId === userId);
    
    if (configIndex === -1) {
      return false;
    }
    
    allConfigs.splice(configIndex, 1);
    await this.writeConfigs(allConfigs);
    
    return true;
  }

  // 检查配置名称是否已存在（同一用户下）
  async isNameExists(name: string, userId: string, excludeId?: string): Promise<boolean> {
    const userConfigs = await this.getConfigsByUserId(userId);
    return userConfigs.some(config => 
      config.name === name && config.id !== excludeId
    );
  }

  // 获取用户的配置统计
  async getConfigStats(userId: string): Promise<{
    totalConfigs: number;
    totalModels: number;
    providers: string[];
  }> {
    const userConfigs = await this.getConfigsByUserId(userId);
    
    const allModels = new Set<string>();
    const providers = new Set<string>();
    
    userConfigs.forEach(config => {
      config.models.forEach(model => allModels.add(model));
      
      // 从baseUrl推断提供商
      if (config.baseUrl.includes('openai.com')) {
        providers.add('OpenAI');
      } else if (config.baseUrl.includes('anthropic.com')) {
        providers.add('Anthropic');
      } else if (config.baseUrl.includes('google.com')) {
        providers.add('Google');
      } else {
        providers.add('Custom');
      }
    });
    
    return {
      totalConfigs: userConfigs.length,
      totalModels: allModels.size,
      providers: Array.from(providers)
    };
  }

  // 清理过期或无效的配置
  async cleanupConfigs(): Promise<number> {
    const allConfigs = await this.readConfigs();
    const validConfigs = allConfigs.filter(config => {
      // 检查必要字段
      return config.id && config.name && config.baseUrl && config.apiKey && config.userId;
    });
    
    const removedCount = allConfigs.length - validConfigs.length;
    
    if (removedCount > 0) {
      await this.writeConfigs(validConfigs);
    }
    
    return removedCount;
  }
}