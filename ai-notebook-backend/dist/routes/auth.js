"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const userStorage_1 = require("../storage/userStorage");
const router = express_1.default.Router();
// 生成JWT令牌
const generateTokens = (userId, email) => {
    const payload = { userId, email };
    const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
    const refresh_token = jsonwebtoken_1.default.sign(payload, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key', { expiresIn: '7d' });
    return { token, refresh_token };
};
// 用户注册
router.post('/register', async (req, res, next) => {
    try {
        const { username, email, password, confirm_password } = req.body;
        // 验证输入
        if (!username || !email || !password || !confirm_password) {
            throw (0, errorHandler_1.createError)('所有字段都是必填的', 400);
        }
        if (password !== confirm_password) {
            throw (0, errorHandler_1.createError)('密码确认不匹配', 400);
        }
        if (password.length < 6) {
            throw (0, errorHandler_1.createError)('密码长度至少为6位', 400);
        }
        // 检查用户是否已存在
        const existingUserByEmail = await userStorage_1.userStorage.findByEmail(email);
        if (existingUserByEmail) {
            throw (0, errorHandler_1.createError)('邮箱已存在', 409);
        }
        // 检查用户名是否已存在
        const allUsers = await userStorage_1.userStorage.getAll();
        const existingUserByUsername = allUsers.find(u => u.username === username);
        if (existingUserByUsername) {
            throw (0, errorHandler_1.createError)('用户名已存在', 409);
        }
        // 加密密码
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // 创建新用户
        const newUser = await userStorage_1.userStorage.create({
            username,
            email,
            password: hashedPassword
        });
        // 生成令牌
        const tokens = generateTokens(newUser.id, newUser.email);
        // 返回响应（不包含密码）
        const response = {
            ...tokens,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                created_at: newUser.created_at,
                updated_at: newUser.updated_at
            }
        };
        res.status(201).json({
            success: true,
            message: '注册成功',
            data: response
        });
    }
    catch (error) {
        next(error);
    }
});
// 用户登录
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // 验证输入
        if (!email || !password) {
            throw (0, errorHandler_1.createError)('邮箱和密码都是必填的', 400);
        }
        // 查找用户
        const user = await userStorage_1.userStorage.findByEmail(email);
        if (!user) {
            throw (0, errorHandler_1.createError)('邮箱或密码错误', 401);
        }
        // 验证密码
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw (0, errorHandler_1.createError)('邮箱或密码错误', 401);
        }
        // 生成令牌
        const tokens = generateTokens(user.id, user.email);
        // 返回响应（不包含密码）
        const response = {
            ...tokens,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at,
                updated_at: user.updated_at
            }
        };
        res.json({
            success: true,
            message: '登录成功',
            data: response
        });
    }
    catch (error) {
        next(error);
    }
});
// 刷新令牌
router.post('/refresh', (req, res, next) => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            throw (0, errorHandler_1.createError)('刷新令牌是必需的', 400);
        }
        // 验证刷新令牌
        const decoded = jsonwebtoken_1.default.verify(refresh_token, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
        // 生成新的令牌
        const tokens = generateTokens(decoded.userId, decoded.email);
        res.json({
            success: true,
            message: '令牌刷新成功',
            data: tokens
        });
    }
    catch (error) {
        next((0, errorHandler_1.createError)('无效的刷新令牌', 401));
    }
});
// 获取当前用户信息
router.get('/me', auth_1.authenticateToken, async (req, res, next) => {
    try {
        if (!req.user) {
            throw (0, errorHandler_1.createError)('用户信息不存在', 401);
        }
        // 查找用户
        const user = await userStorage_1.userStorage.findById(req.user.userId);
        if (!user) {
            throw (0, errorHandler_1.createError)('用户不存在', 404);
        }
        // 返回用户信息（不包含密码）
        const userInfo = {
            id: user.id,
            username: user.username,
            email: user.email,
            created_at: user.created_at,
            updated_at: user.updated_at
        };
        res.json({
            success: true,
            message: '获取用户信息成功',
            data: userInfo
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map