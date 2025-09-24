"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteStorage = exports.NotebookStorage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// 数据存储目录
const DATA_DIR = path_1.default.join(__dirname, '../../data');
const NOTEBOOKS_FILE = path_1.default.join(DATA_DIR, 'notebooks.json');
const NOTES_FILE = path_1.default.join(DATA_DIR, 'notes.json');
// 确保数据目录存在
if (!fs_1.default.existsSync(DATA_DIR)) {
    fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
}
// 笔记本数据管理
class NotebookStorage {
    static load() {
        if (this.loaded)
            return this.data;
        try {
            if (fs_1.default.existsSync(NOTEBOOKS_FILE)) {
                const fileContent = fs_1.default.readFileSync(NOTEBOOKS_FILE, 'utf-8');
                this.data = JSON.parse(fileContent);
            }
            else {
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
        }
        catch (error) {
            console.error('Failed to load notebooks:', error);
            this.data = [];
        }
        this.loaded = true;
        return this.data;
    }
    static save() {
        try {
            fs_1.default.writeFileSync(NOTEBOOKS_FILE, JSON.stringify(this.data, null, 2));
        }
        catch (error) {
            console.error('Failed to save notebooks:', error);
        }
    }
    static getAll() {
        return this.load();
    }
    static add(notebook) {
        this.load();
        this.data.push(notebook);
        this.save();
        return notebook;
    }
    static update(id, updates) {
        this.load();
        const index = this.data.findIndex(nb => nb.id === id);
        if (index !== -1) {
            this.data[index] = { ...this.data[index], ...updates };
            this.save();
            return this.data[index];
        }
        return null;
    }
    static delete(id) {
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
exports.NotebookStorage = NotebookStorage;
NotebookStorage.data = [];
NotebookStorage.loaded = false;
// 笔记数据管理
class NoteStorage {
    static load() {
        if (this.loaded)
            return this.data;
        try {
            if (fs_1.default.existsSync(NOTES_FILE)) {
                const fileContent = fs_1.default.readFileSync(NOTES_FILE, 'utf-8');
                this.data = JSON.parse(fileContent);
            }
            else {
                this.data = [];
                this.save();
            }
        }
        catch (error) {
            console.error('Failed to load notes:', error);
            this.data = [];
        }
        this.loaded = true;
        return this.data;
    }
    static save() {
        try {
            fs_1.default.writeFileSync(NOTES_FILE, JSON.stringify(this.data, null, 2));
        }
        catch (error) {
            console.error('Failed to save notes:', error);
        }
    }
    static getAll() {
        return this.load();
    }
    static add(note) {
        this.load();
        this.data.push(note);
        this.save();
        return note;
    }
    static update(id, updates) {
        this.load();
        const index = this.data.findIndex(note => note.id === id);
        if (index !== -1) {
            this.data[index] = { ...this.data[index], ...updates };
            this.save();
            return this.data[index];
        }
        return null;
    }
    static delete(id) {
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
exports.NoteStorage = NoteStorage;
NoteStorage.data = [];
NoteStorage.loaded = false;
// 初始化存储
NotebookStorage.load();
NoteStorage.load();
//# sourceMappingURL=storage.js.map