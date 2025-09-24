"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const storage_1 = require("../utils/storage");
const router = express_1.default.Router();
// 使用持久化存储
const getNotes = () => storage_1.NoteStorage.getAll();
exports.getNotes = getNotes;
// 动态计算下一个笔记ID
const getNextNoteId = () => {
    const allNotes = storage_1.NoteStorage.getAll();
    if (allNotes.length === 0) {
        return 1;
    }
    const maxId = Math.max(...allNotes.map(note => parseInt(note.id) || 0));
    return maxId + 1;
};
// 将数据存储到全局变量中（临时方案）
global.notes = (0, exports.getNotes)();
// 获取笔记列表
router.get('/', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { notebook_id, page = 1, limit = 20, favorite, archived } = req.query;
        // 过滤用户的笔记
        const allNotes = storage_1.NoteStorage.getAll();
        let userNotes = allNotes.filter(note => note.user_id === userId && !note.is_deleted);
        // 如果指定了笔记本ID，进一步过滤
        if (notebook_id) {
            userNotes = userNotes.filter(note => note.notebook_id === notebook_id);
        }
        // 如果指定了收藏状态，进一步过滤
        if (favorite !== undefined) {
            const isFavorite = favorite === 'true';
            userNotes = userNotes.filter(note => note.is_favorite === isFavorite);
        }
        // 如果指定了归档状态，进一步过滤
        if (archived !== undefined) {
            const isArchived = archived === 'true';
            userNotes = userNotes.filter(note => note.is_archived === isArchived);
        }
        // 分页
        const startIndex = (Number(page) - 1) * Number(limit);
        const endIndex = startIndex + Number(limit);
        const paginatedNotes = userNotes.slice(startIndex, endIndex);
        const pagination = {
            page: Number(page),
            limit: Number(limit),
            total: userNotes.length,
            totalPages: Math.ceil(userNotes.length / Number(limit))
        };
        res.json({
            success: true,
            data: {
                notes: paginatedNotes,
                pagination
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// 获取单个笔记
router.get('/:id', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const noteId = req.params.id;
        const allNotes = storage_1.NoteStorage.getAll();
        const note = allNotes.find(n => n.id === noteId && n.user_id === userId && !n.is_deleted);
        if (!note) {
            throw (0, errorHandler_1.createError)('笔记不存在', 404);
        }
        res.json({
            success: true,
            data: note
        });
    }
    catch (error) {
        next(error);
    }
});
// 创建笔记
router.post('/', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { title, content, notebook_id, tags = [], status = 'draft' } = req.body;
        // 验证必填字段 - 标题或内容至少有一个
        if (!title && !content) {
            throw (0, errorHandler_1.createError)('标题或内容不能同时为空', 400);
        }
        const safeContent = content || '';
        const contentLength = typeof safeContent === 'string' ? safeContent.length : JSON.stringify(safeContent).length;
        const newNote = {
            id: getNextNoteId().toString(),
            title: title || '无标题',
            content: safeContent,
            content_text: typeof safeContent === 'string' ? safeContent : JSON.stringify(safeContent),
            excerpt: typeof safeContent === 'string' ? safeContent.substring(0, 100) : '',
            notebook_id: notebook_id || null,
            user_id: userId,
            tags,
            status,
            is_favorite: false,
            is_archived: false,
            is_deleted: false,
            metadata: {
                word_count: contentLength,
                reading_time: Math.ceil(contentLength / 200) || 1
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        storage_1.NoteStorage.add(newNote);
        res.status(201).json({
            success: true,
            data: newNote,
            message: '笔记创建成功'
        });
    }
    catch (error) {
        next(error);
    }
});
// 更新笔记
router.put('/:id', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const noteId = req.params.id;
        const { title, content, tags, status } = req.body;
        const allNotes = storage_1.NoteStorage.getAll();
        const note = allNotes.find(n => n.id === noteId && n.user_id === userId && !n.is_deleted);
        if (!note) {
            throw (0, errorHandler_1.createError)('笔记不存在', 404);
        }
        // 准备更新数据
        const updates = { updated_at: new Date().toISOString() };
        if (title !== undefined)
            updates.title = title;
        if (content !== undefined) {
            updates.content = content;
            updates.content_text = typeof content === 'string' ? content : JSON.stringify(content);
            updates.excerpt = typeof content === 'string' ? content.substring(0, 100) : '';
            // 更新元数据
            const contentLength = typeof content === 'string' ? content.length : JSON.stringify(content).length;
            updates.metadata = {
                ...note.metadata,
                word_count: contentLength,
                reading_time: Math.ceil(contentLength / 200) || 1
            };
        }
        if (tags !== undefined)
            updates.tags = tags;
        if (status !== undefined)
            updates.status = status;
        const updatedNote = storage_1.NoteStorage.update(noteId, updates);
        res.json({
            success: true,
            data: updatedNote,
            message: '笔记更新成功'
        });
    }
    catch (error) {
        next(error);
    }
});
// 删除笔记
router.delete('/:id', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const noteId = req.params.id;
        const { permanent = false } = req.query;
        const allNotes = storage_1.NoteStorage.getAll();
        const note = allNotes.find(n => n.id === noteId && n.user_id === userId);
        if (!note) {
            throw (0, errorHandler_1.createError)('笔记不存在', 404);
        }
        if (permanent === 'true') {
            // 永久删除
            storage_1.NoteStorage.delete(noteId);
        }
        else {
            // 软删除
            storage_1.NoteStorage.update(noteId, {
                is_deleted: true,
                deleted_at: new Date().toISOString()
            });
        }
        res.json({
            success: true,
            message: permanent === 'true' ? '笔记已永久删除' : '笔记已删除'
        });
    }
    catch (error) {
        next(error);
    }
});
// 收藏/取消收藏笔记
router.post('/:id/favorite', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const noteId = req.params.id;
        const allNotes = storage_1.NoteStorage.getAll();
        const note = allNotes.find(n => n.id === noteId && n.user_id === userId && !n.is_deleted);
        if (!note) {
            throw (0, errorHandler_1.createError)('笔记不存在', 404);
        }
        const updatedNote = storage_1.NoteStorage.update(noteId, {
            is_favorite: !note.is_favorite,
            updated_at: new Date().toISOString()
        });
        res.json({
            success: true,
            data: updatedNote,
            message: updatedNote?.is_favorite ? '已收藏' : '已取消收藏'
        });
    }
    catch (error) {
        next(error);
    }
});
// 归档/取消归档笔记
router.post('/:id/archive', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const noteId = req.params.id;
        const allNotes = storage_1.NoteStorage.getAll();
        const note = allNotes.find(n => n.id === noteId && n.user_id === userId && !n.is_deleted);
        if (!note) {
            throw (0, errorHandler_1.createError)('笔记不存在', 404);
        }
        const updatedNote = storage_1.NoteStorage.update(noteId, {
            is_archived: !note.is_archived,
            updated_at: new Date().toISOString()
        });
        res.json({
            success: true,
            data: updatedNote,
            message: updatedNote?.is_archived ? '已归档' : '已取消归档'
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=notes.js.map