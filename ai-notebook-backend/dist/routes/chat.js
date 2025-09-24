"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const chatService_1 = require("../services/chatService");
const apiConfigStorage_1 = require("../storage/apiConfigStorage");
const router = express_1.default.Router();
const chatService = new chatService_1.ChatService();
const apiConfigStorage = new apiConfigStorage_1.ApiConfigStorage();
// 发送消息
router.post('/message', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: '用户未认证' });
        }
        const { message, model, history } = req.body;
        if (!message || !model) {
            return res.status(400).json({
                success: false,
                message: '消息内容和模型不能为空'
            });
        }
        const response = await chatService.sendMessage({
            message,
            model,
            history: history || [],
            userId
        });
        res.json({
            success: true,
            data: response
        });
    }
    catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: '发送消息失败',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// 获取可用模型列表
router.get('/models', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: '用户未认证' });
        }
        const models = await chatService.getAvailableModels(userId);
        res.json({
            success: true,
            data: models
        });
    }
    catch (error) {
        console.error('Get models error:', error);
        res.status(500).json({
            success: false,
            message: '获取模型列表失败',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// 获取API配置列表
router.get('/configs', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: '用户未认证' });
        }
        const configs = await apiConfigStorage.getConfigsByUserId(userId);
        // 隐藏API密钥的敏感信息
        const safeConfigs = configs.map(config => ({
            ...config,
            apiKey: config.apiKey ? '***' + config.apiKey.slice(-4) : ''
        }));
        res.json({
            success: true,
            data: safeConfigs
        });
    }
    catch (error) {
        console.error('Get configs error:', error);
        res.status(500).json({
            success: false,
            message: '获取API配置失败',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// 添加API配置
router.post('/configs', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: '用户未认证' });
        }
        const { name, baseUrl, apiKey, models } = req.body;
        if (!name || !baseUrl || !apiKey) {
            return res.status(400).json({
                success: false,
                message: '配置名称、基础URL和API密钥不能为空'
            });
        }
        const config = await apiConfigStorage.createConfig({
            name,
            baseUrl,
            apiKey,
            models: models || [],
            userId: userId,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        // 返回时隐藏API密钥
        const safeConfig = {
            ...config,
            apiKey: '***' + config.apiKey.slice(-4)
        };
        res.status(201).json({
            success: true,
            data: safeConfig
        });
    }
    catch (error) {
        console.error('Create config error:', error);
        res.status(500).json({
            success: false,
            message: '创建API配置失败',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// 更新API配置
router.put('/configs/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: '用户未认证' });
        }
        const { id } = req.params;
        const { name, baseUrl, apiKey, models } = req.body;
        const config = await apiConfigStorage.updateConfig(id, {
            name,
            baseUrl,
            apiKey,
            models,
            updatedAt: new Date()
        }, userId);
        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'API配置不存在或无权限访问'
            });
        }
        // 返回时隐藏API密钥
        const safeConfig = {
            ...config,
            apiKey: config.apiKey ? '***' + config.apiKey.slice(-4) : ''
        };
        res.json({
            success: true,
            data: safeConfig
        });
    }
    catch (error) {
        console.error('Update config error:', error);
        res.status(500).json({
            success: false,
            message: '更新API配置失败',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// 删除API配置
router.delete('/configs/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: '用户未认证' });
        }
        const { id } = req.params;
        const success = await apiConfigStorage.deleteConfig(id, userId);
        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'API配置不存在或无权限访问'
            });
        }
        res.json({
            success: true,
            message: 'API配置删除成功'
        });
    }
    catch (error) {
        console.error('Delete config error:', error);
        res.status(500).json({
            success: false,
            message: '删除API配置失败',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=chat.js.map