import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { NotebookStorage, NoteStorage } from '../utils/storage';

const router = express.Router();

// 使用持久化存储
export const getNotebooks = () => NotebookStorage.getAll();
let notebookIdCounter = 2;

// 将数据存储到全局变量中（临时方案）
(global as any).notebooks = getNotebooks();

// 获取笔记本列表
router.get('/', async (req, res, next) => {
  try {
    const userId = '1'; // 临时使用默认用户ID
    
    // 获取用户的笔记本
    const allNotebooks = NotebookStorage.getAll();
    let userNotebooks = allNotebooks.filter(nb => nb.user_id === userId);
    
    // 获取所有笔记并计算每个笔记本的笔记数量
    const allNotes = NoteStorage.getAll();
    userNotebooks = userNotebooks.map(notebook => {
      const noteCount = allNotes.filter(note => 
        note.notebook_id === notebook.id && 
        note.user_id === userId && 
        !note.is_deleted
      ).length;
      return {
        ...notebook,
        note_count: noteCount
      };
    });
    
    res.json({
      success: true,
      data: userNotebooks
    });
  } catch (error) {
    next(error);
  }
});

// 获取单个笔记本
router.get('/:id', async (req, res, next) => {
  try {
    const userId = '1'; // 临时使用默认用户ID
    const notebookId = req.params.id;
    
    const allNotebooks = NotebookStorage.getAll();
    const notebook = allNotebooks.find(nb => nb.id === notebookId && nb.user_id === userId);
    
    if (!notebook) {
      throw createError('笔记本不存在', 404);
    }
    
    // 计算笔记数量
    const allNotes = NoteStorage.getAll();
    const noteCount = allNotes.filter(note => 
      note.notebook_id === notebookId && 
      note.user_id === userId && 
      !note.is_deleted
    ).length;
    
    res.json({
      success: true,
      data: {
        ...notebook,
        note_count: noteCount
      }
    });
  } catch (error) {
    next(error);
  }
});

// 创建笔记本
router.post('/', async (req, res, next) => {
  try {
    const userId = '1'; // 临时使用默认用户ID
    const { title, description, color = '#1890ff' } = req.body;
    
    if (!title) {
      throw createError('笔记本标题不能为空', 400);
    }
    
    const newNotebook = {
      id: notebookIdCounter.toString(),
      title,
      description: description || '',
      color,
      user_id: userId,
      is_shared: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      note_count: 0
    };
    
    NotebookStorage.add(newNotebook);
    notebookIdCounter++;
    
    res.status(201).json({
      success: true,
      data: newNotebook,
      message: '笔记本创建成功'
    });
  } catch (error) {
    next(error);
  }
});

// 更新笔记本
router.put('/:id', async (req, res, next) => {
  try {
    const userId = '1'; // 临时使用默认用户ID
    const notebookId = req.params.id;
    const { title, description, color } = req.body;
    
    const allNotebooks = NotebookStorage.getAll();
    const notebook = allNotebooks.find(nb => nb.id === notebookId && nb.user_id === userId);
    
    if (!notebook) {
      throw createError('笔记本不存在', 404);
    }
    
    // 更新笔记本信息
    const updates: any = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (color !== undefined) updates.color = color;
    
    const updatedNotebook = NotebookStorage.update(notebookId, updates);
    
    res.json({
      success: true,
      data: updatedNotebook,
      message: '笔记本更新成功'
    });
  } catch (error) {
    next(error);
  }
});

// 删除笔记本
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = (req as any).user.userId;
    const notebookId = req.params.id;
    
    const allNotebooks = NotebookStorage.getAll();
    const notebook = allNotebooks.find(nb => nb.id === notebookId && nb.user_id === userId);
    
    if (!notebook) {
      throw createError('笔记本不存在', 404);
    }
    
    // 检查是否有笔记在此笔记本中
    // 这里应该检查notes数组，但为了简化，我们直接删除
    NotebookStorage.delete(notebookId);
    
    res.json({
      success: true,
      message: '笔记本删除成功'
    });
  } catch (error) {
    next(error);
  }
});

export default router;