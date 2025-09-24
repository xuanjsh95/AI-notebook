import fs from 'fs';
import path from 'path';

// 数据存储目录
const DATA_DIR = path.join(__dirname, '../../data');
const NOTEBOOKS_FILE = path.join(DATA_DIR, 'notebooks.json');
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 笔记本数据管理
export class NotebookStorage {
  private static data: any[] = [];
  private static loaded = false;

  static load() {
    if (this.loaded) return this.data;
    
    try {
      if (fs.existsSync(NOTEBOOKS_FILE)) {
        const fileContent = fs.readFileSync(NOTEBOOKS_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        // 初始化默认数据
        this.data = [
          {
            id: '1',
            title: '默认笔记本',
            description: '系统默认笔记本',
            color: '#1890ff',
            user_id: '1',
            is_shared: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            note_count: 0
          }
        ];
        this.save();
      }
    } catch (error) {
      console.error('Failed to load notebooks:', error);
      this.data = [];
    }
    
    this.loaded = true;
    return this.data;
  }

  static save() {
    try {
      fs.writeFileSync(NOTEBOOKS_FILE, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save notebooks:', error);
    }
  }

  static getAll() {
    return this.load();
  }

  static add(notebook: any) {
    this.load();
    this.data.push(notebook);
    this.save();
    return notebook;
  }

  static update(id: string, updates: any) {
    this.load();
    const index = this.data.findIndex(nb => nb.id === id);
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...updates };
      this.save();
      return this.data[index];
    }
    return null;
  }

  static delete(id: string) {
    this.load();
    const index = this.data.findIndex(nb => nb.id === id);
    if (index !== -1) {
      const deleted = this.data.splice(index, 1)[0];
      this.save();
      return deleted;
    }
    return null;
  }
}

// 笔记数据管理
export class NoteStorage {
  private static data: any[] = [];
  private static loaded = false;

  static load() {
    if (this.loaded) return this.data;
    
    try {
      if (fs.existsSync(NOTES_FILE)) {
        const fileContent = fs.readFileSync(NOTES_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.data = [];
        this.save();
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
      this.data = [];
    }
    
    this.loaded = true;
    return this.data;
  }

  static save() {
    try {
      fs.writeFileSync(NOTES_FILE, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  }

  static getAll() {
    return this.load();
  }

  static add(note: any) {
    this.load();
    this.data.push(note);
    this.save();
    return note;
  }

  static update(id: string, updates: any) {
    this.load();
    const index = this.data.findIndex(note => note.id === id);
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...updates };
      this.save();
      return this.data[index];
    }
    return null;
  }

  static delete(id: string) {
    this.load();
    const index = this.data.findIndex(note => note.id === id);
    if (index !== -1) {
      const deleted = this.data.splice(index, 1)[0];
      this.save();
      return deleted;
    }
    return null;
  }
}

// 初始化存储
NotebookStorage.load();
NoteStorage.load();