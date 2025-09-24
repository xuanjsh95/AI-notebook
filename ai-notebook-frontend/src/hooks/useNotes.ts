import { useState, useEffect, useCallback } from 'react';
import { Note, Notebook, Tag, SearchRequest, SearchResult } from '../types';
import { noteAPI, notebookAPI, tagAPI, searchAPI } from '../services/api';

export const useNotes = (notebookId?: string) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let notesData: Note[];
      if (notebookId) {
        const response = await noteAPI.getNotes({ notebook_id: notebookId });
        notesData = response.notes;
      } else {
        const response = await noteAPI.getNotes();
        notesData = response.notes;
      }
      
      setNotes(notesData);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
      setError('获取笔记失败');
    } finally {
      setLoading(false);
    }
  }, [notebookId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const createNote = useCallback(async (noteData: Partial<Note>) => {
    try {
      const newNote = await noteAPI.createNote(noteData as any);
      setNotes(prev => [newNote, ...prev]);
      return newNote;
    } catch (err) {
      console.error('Failed to create note:', err);
      throw new Error('创建笔记失败');
    }
  }, []);

  const updateNote = useCallback(async (id: string, noteData: Partial<Note>) => {
    try {
      const updatedNote = await noteAPI.updateNote(id, noteData);
      setNotes(prev => prev.map(note => note.id === id ? updatedNote : note));
      return updatedNote;
    } catch (err) {
      console.error('Failed to update note:', err);
      throw new Error('更新笔记失败');
    }
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    try {
      await noteAPI.deleteNote(id);
      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (err) {
      console.error('Failed to delete note:', err);
      throw new Error('删除笔记失败');
    }
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    try {
      const updatedNote = await noteAPI.toggleFavorite(id);
      setNotes(prev => prev.map(note => note.id === id ? updatedNote : note));
      return updatedNote;
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      throw new Error('操作失败');
    }
  }, []);

  const toggleArchive = useCallback(async (id: string) => {
    try {
      const updatedNote = await noteAPI.toggleArchive(id);
      setNotes(prev => prev.map(note => note.id === id ? updatedNote : note));
      return updatedNote;
    } catch (err) {
      console.error('Failed to toggle archive:', err);
      throw new Error('操作失败');
    }
  }, []);

  return {
    notes,
    loading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    toggleFavorite,
    toggleArchive,
  };
};

export const useNote = (id: string) => {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNote = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const noteData = await noteAPI.getNote(id);
      setNote(noteData);
    } catch (err) {
      console.error('Failed to fetch note:', err);
      setError('获取笔记失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  const updateNote = useCallback(async (noteData: Partial<Note>) => {
    if (!note) return;
    
    try {
      const updatedNote = await noteAPI.updateNote(note.id, noteData);
      setNote(updatedNote);
      return updatedNote;
    } catch (err) {
      console.error('Failed to update note:', err);
      throw new Error('更新笔记失败');
    }
  }, [note]);

  return {
    note,
    loading,
    error,
    fetchNote,
    updateNote,
  };
};

export const useNotebooks = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotebooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const notebooksData = await notebookAPI.getNotebooks();
      setNotebooks(notebooksData);
    } catch (err) {
      console.error('Failed to fetch notebooks:', err);
      setError('获取笔记本失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotebooks();
  }, [fetchNotebooks]);

  const createNotebook = useCallback(async (notebookData: { title: string; description?: string }) => {
    try {
      const newNotebook = await notebookAPI.createNotebook({ ...notebookData, is_shared: false });
      setNotebooks(prev => [newNotebook, ...prev]);
      return newNotebook;
    } catch (err) {
      console.error('Failed to create notebook:', err);
      throw new Error('创建笔记本失败');
    }
  }, []);

  const updateNotebook = useCallback(async (id: string, notebookData: { title: string; description?: string }) => {
    try {
      const updatedNotebook = await notebookAPI.updateNotebook(id, notebookData);
      setNotebooks(prev => prev.map(notebook => notebook.id === id ? updatedNotebook : notebook));
      return updatedNotebook;
    } catch (err) {
      console.error('Failed to update notebook:', err);
      throw new Error('更新笔记本失败');
    }
  }, []);

  const deleteNotebook = useCallback(async (id: string) => {
    try {
      await notebookAPI.deleteNotebook(id);
      setNotebooks(prev => prev.filter(notebook => notebook.id !== id));
    } catch (err) {
      console.error('Failed to delete notebook:', err);
      throw new Error('删除笔记本失败');
    }
  }, []);

  return {
    notebooks,
    loading,
    error,
    fetchNotebooks,
    createNotebook,
    updateNotebook,
    deleteNotebook,
  };
};

export const useTags = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const tagsData = await tagAPI.getTags();
      setTags(tagsData);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
      setError('获取标签失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const createTag = useCallback(async (name: string) => {
    try {
      const newTag = await tagAPI.createTag({ name });
      setTags(prev => [newTag, ...prev]);
      return newTag;
    } catch (err) {
      console.error('Failed to create tag:', err);
      throw new Error('创建标签失败');
    }
  }, []);

  const updateTag = useCallback(async (id: string, name: string) => {
    try {
      const updatedTag = await tagAPI.updateTag(id, { name });
      setTags(prev => prev.map(tag => tag.id === id ? updatedTag : tag));
      return updatedTag;
    } catch (err) {
      console.error('Failed to update tag:', err);
      throw new Error('更新标签失败');
    }
  }, []);

  const deleteTag = useCallback(async (id: string) => {
    try {
      await tagAPI.deleteTag(id);
      setTags(prev => prev.filter(tag => tag.id !== id));
    } catch (err) {
      console.error('Failed to delete tag:', err);
      throw new Error('删除标签失败');
    }
  }, []);

  return {
    tags,
    loading,
    error,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
  };
};

export const useSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (request: SearchRequest) => {
    try {
      setLoading(true);
      setError(null);
      const searchResults = await searchAPI.search(request);
      setResults(searchResults.results);
      return searchResults;
    } catch (err) {
      console.error('Search failed:', err);
      setError('搜索失败');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  };
};

export default useNotes;