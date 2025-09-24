"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
// 临时存储标签数据（实际项目中应该使用数据库）
let tags = [
    {
        id: '1',
        name: '工作',
        user_id: '',
        created_at: new Date().toISOString()
    },
    {
        id: '2',
        name: '学习',
        user_id: '',
        created_at: new Date().toISOString()
    },
    {
        id: '3',
        name: '生活',
        user_id: '',
        created_at: new Date().toISOString()
    }
];
let tagIdCounter = 4;
// 获取标签列表
router.get('/', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        // 返回用户的标签和公共标签
        const userTags = tags.filter(tag => tag.user_id === userId || tag.user_id === '');
        res.json({
            success: true,
            data: userTags
        });
    }
    catch (error) {
        next(error);
    }
});
// 创建标签
router.post('/', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { name } = req.body;
        if (!name) {
            throw (0, errorHandler_1.createError)('标签名称不能为空', 400);
        }
        // 检查标签是否已存在
        const existingTag = tags.find(tag => tag.name === name && (tag.user_id === userId || tag.user_id === ''));
        if (existingTag) {
            throw (0, errorHandler_1.createError)('标签已存在', 400);
        }
        const newTag = {
            id: tagIdCounter.toString(),
            name,
            user_id: userId,
            created_at: new Date().toISOString()
        };
        tags.push(newTag);
        tagIdCounter++;
        res.status(201).json({
            success: true,
            data: newTag,
            message: '标签创建成功'
        });
    }
    catch (error) {
        next(error);
    }
});
// 删除标签
router.delete('/:id', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const tagId = req.params.id;
        const tagIndex = tags.findIndex(tag => tag.id === tagId && tag.user_id === userId);
        if (tagIndex === -1) {
            throw (0, errorHandler_1.createError)('标签不存在', 404);
        }
        tags.splice(tagIndex, 1);
        res.json({
            success: true,
            message: '标签删除成功'
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=tags.js.map