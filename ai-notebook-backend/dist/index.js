"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const notes_1 = __importDefault(require("./routes/notes"));
const notebooks_1 = __importDefault(require("./routes/notebooks"));
const tags_1 = __importDefault(require("./routes/tags"));
const users_1 = __importDefault(require("./routes/users"));
const chat_1 = __importDefault(require("./routes/chat"));
const errorHandler_1 = require("./middleware/errorHandler");
// 加载环境变量
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// 中间件
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// 路由
app.use('/api/auth', auth_1.default);
app.use('/api/notes', notes_1.default);
app.use('/api/notebooks', notebooks_1.default);
app.use('/api/tags', tags_1.default);
app.use('/api/users', users_1.default);
app.use('/api/chat', chat_1.default);
// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'AI Notebook Backend is running' });
});
// 错误处理中间件
app.use(errorHandler_1.errorHandler);
// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📝 AI Notebook Backend started successfully`);
});
exports.default = app;
//# sourceMappingURL=index.js.map