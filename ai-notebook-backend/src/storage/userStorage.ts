import fs from 'fs/promises';
import path from 'path';
import { User } from '../types';

export class UserStorage {
  private dataDir: string;
  private usersFile: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.usersFile = path.join(this.dataDir, 'users.json');
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

  // 读取所有用户
  private async readUsers(): Promise<User[]> {
    try {
      const data = await fs.readFile(this.usersFile, 'utf-8');
      const users = JSON.parse(data);
      
      // 转换日期字符串为Date对象
      return users.map((user: any) => ({
        ...user,
        created_at: new Date(user.createdAt || user.created_at),
        updated_at: new Date(user.updatedAt || user.updated_at)
      }));
    } catch (error) {
      // 文件不存在或格式错误，返回空数组
      return [];
    }
  }

  // 写入用户数据
  private async writeUsers(users: User[]): Promise<void> {
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
    
    await fs.writeFile(this.usersFile, JSON.stringify(usersData, null, 2));
  }

  // 根据邮箱查找用户
  async findByEmail(email: string): Promise<User | null> {
    const users = await this.readUsers();
    return users.find(user => user.email === email) || null;
  }

  // 根据ID查找用户
  async findById(id: string): Promise<User | null> {
    const users = await this.readUsers();
    return users.find(user => user.id === id) || null;
  }

  // 创建新用户
  async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const users = await this.readUsers();
    
    const newUser: User = {
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
  async update(id: string, userData: Partial<Omit<User, 'id' | 'created_at'>>): Promise<User | null> {
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
  async delete(id: string): Promise<boolean> {
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
  async getAll(): Promise<User[]> {
    return await this.readUsers();
  }
}

// 导出单例实例
export const userStorage = new UserStorage();