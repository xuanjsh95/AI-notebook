"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiConfigStorage = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
class ApiConfigStorage {
    constructor() {
        this.dataDir = path_1.default.join(process.cwd(), 'data');
        this.configsFile = path_1.default.join(this.dataDir, 'api-configs.json');
        this.ensureDataDir();
    }
    // 确保数据目录存在
    async ensureDataDir() {
        try {
            await promises_1.default.access(this.dataDir);
        }
        catch {
            await promises_1.default.mkdir(this.dataDir, { recursive: true });
        }
    }
    // 读取所有配置
    async readConfigs() {
        try {
            const data = await promises_1.default.readFile(this.configsFile, 'utf-8');
            const configs = JSON.parse(data);
            // 转换日期字符串为Date对象
            return configs.map((config) => ({
                ...config,
                createdAt: new Date(config.createdAt),
                updatedAt: new Date(config.updatedAt)
            }));
        }
        catch (error) {
            // 文件不存在或格式错误，返回空数组
            return [];
        }
    }
    // 写入所有配置
    async writeConfigs(configs) {
        await this.ensureDataDir();
        await promises_1.default.writeFile(this.configsFile, JSON.stringify(configs, null, 2), 'utf-8');
    }
    // 根据用户ID获取配置列表
    async getConfigsByUserId(userId) {
        const allConfigs = await this.readConfigs();
        return allConfigs.filter(config => config.userId === userId);
    }
    // 根据ID获取单个配置
    async getConfigById(id, userId) {
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
    async createConfig(configData) {
        const allConfigs = await this.readConfigs();
        const newConfig = {
            id: (0, uuid_1.v4)(),
            ...configData
        };
        allConfigs.push(newConfig);
        await this.writeConfigs(allConfigs);
        return newConfig;
    }
    // 更新配置
    async updateConfig(id, updates, userId) {
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
    async deleteConfig(id, userId) {
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
    async isNameExists(name, userId, excludeId) {
        const userConfigs = await this.getConfigsByUserId(userId);
        return userConfigs.some(config => config.name === name && config.id !== excludeId);
    }
    // 获取用户的配置统计
    async getConfigStats(userId) {
        const userConfigs = await this.getConfigsByUserId(userId);
        const allModels = new Set();
        const providers = new Set();
        userConfigs.forEach(config => {
            config.models.forEach(model => allModels.add(model));
            // 从baseUrl推断提供商
            if (config.baseUrl.includes('openai.com')) {
                providers.add('OpenAI');
            }
            else if (config.baseUrl.includes('anthropic.com')) {
                providers.add('Anthropic');
            }
            else if (config.baseUrl.includes('google.com')) {
                providers.add('Google');
            }
            else {
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
    async cleanupConfigs() {
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
exports.ApiConfigStorage = ApiConfigStorage;
//# sourceMappingURL=apiConfigStorage.js.map