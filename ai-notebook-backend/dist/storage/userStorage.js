"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userStorage = exports.UserStorage = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class UserStorage {
    constructor() {
        this.dataDir = path_1.default.join(process.cwd(), 'data');
        this.usersFile = path_1.default.join(this.dataDir, 'users.json');
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
    // 读取所有用户
    async readUsers() {
        try {
            const data = await promises_1.default.readFile(this.usersFile, 'utf-8');
            const users = JSON.parse(data);
            // 转换日期字符串为Date对象
            return users.map((user) => ({
                ...user,
                created_at: new Date(user.createdAt || user.created_at),
                updated_at: new Date(user.updatedAt || user.updated_at)
            }));
        }
        catch (error) {
            // 文件不存在或格式错误，返回空数组
            return [];
        }
    }
    // 写入用户数据
    async writeUsers(users) {
        await this.ensureDataDir();
        // 转换Date对象为字符串，并确保字段名一致
        const usersData = users.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            password: user.password,
            createdAt: user.created_at.toISOString(),
            updatedAt: user.updated_at.toISOString()
        }));
        await promises_1.default.writeFile(this.usersFile, JSON.stringify(usersData, null, 2));
    }
    // 根据邮箱查找用户
    async findByEmail(email) {
        const users = await this.readUsers();
        return users.find(user => user.email === email) || null;
    }
    // 根据ID查找用户
    async findById(id) {
        const users = await this.readUsers();
        return users.find(user => user.id === id) || null;
    }
    // 创建新用户
    async create(userData) {
        const users = await this.readUsers();
        const newUser = {
            ...userData,
            id: require('crypto').randomUUID(),
            created_at: new Date(),
            updated_at: new Date()
        };
        users.push(newUser);
        await this.writeUsers(users);
        return newUser;
    }
    // 更新用户
    async update(id, userData) {
        const users = await this.readUsers();
        const userIndex = users.findIndex(user => user.id === id);
        if (userIndex === -1) {
            return null;
        }
        users[userIndex] = {
            ...users[userIndex],
            ...userData,
            updated_at: new Date()
        };
        await this.writeUsers(users);
        return users[userIndex];
    }
    // 删除用户
    async delete(id) {
        const users = await this.readUsers();
        const userIndex = users.findIndex(user => user.id === id);
        if (userIndex === -1) {
            return false;
        }
        users.splice(userIndex, 1);
        await this.writeUsers(users);
        return true;
    }
    // 获取所有用户
    async getAll() {
        return await this.readUsers();
    }
}
exports.UserStorage = UserStorage;
// 导出单例实例
exports.userStorage = new UserStorage();
//# sourceMappingURL=userStorage.js.map