import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { NotebookStorage, NoteStorage } from '../utils/storage';

const router = express.Router();

// 获取笔记本数据的函数
function getNotebooksData() {
  return NotebookStorage.getAll();
}

// 获取笔记数据的函数
function getNotesData() {
  return NoteStorage.getAll();
}

// 获取用户统计信息
router.get('/stats', async (req, res, next) => {
  try {
    const userId = '1'; // 临时使用默认用户ID
    
    // 获取笔记本和笔记数据
    const allNotebooks = getNotebooksData();
    const allNotes = getNotesData();
    
    const userNotebooks = allNotebooks.filter((nb: any) => nb.user_id === userId);
    const userNotes = allNotes.filter((note: any) => note.user_id === userId && !note.is_deleted);
    
    // 更新每个笔记本的笔记数量
    userNotebooks.forEach((notebook: any) => {
      const notebookNotes = userNotes.filter((note: any) => note.notebook_id === notebook.id);
      notebook.note_count = notebookNotes.length;
    });
    
    // 计算统计数据
    const totalNotes = userNotes.length;
    const totalNotebooks = userNotebooks.length;
    const totalWords = userNotes.reduce((sum: number, note: any) => {
      // 简单的字数统计（去除HTML标签）
      const textContent = (note.content || '').replace(/<[^>]*>/g, '');
      return sum + textContent.length;
    }, 0);
    
    // 计算本月笔记数
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const notesThisMonth = userNotes.filter((note: any) => {
      const noteDate = new Date(note.created_at);
      return noteDate.getMonth() === currentMonth && noteDate.getFullYear() === currentYear;
    }).length;
    
    // 构建统计响应
    const stats = {
      total_notes: totalNotes,
      total_notebooks: totalNotebooks,
      total_words: totalWords,
      notes_this_month: notesThisMonth,
      most_used_tags: [], // 暂时为空，因为我们要删除标签功能
      recent_activity: [] // 暂时为空
    };
    
    res.json({
      success: true,
      data: stats,
      message: '统计信息获取成功'
    });
  } catch (error) {
    next(error);
  }
});

export default router;