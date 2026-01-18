import { useState, useCallback } from 'react';
import { forumService } from '../services/forumService';

export function useForum(groupId) {
    const [threads, setThreads] = useState([]);
    const [forum, setForum] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchForum = useCallback(async () => {
        if (!groupId) return;
        
        try {
            const response = await forumService.getGroupForums(groupId);
            if (response.data && response.data.length > 0) {
                setForum(response.data[0]);
            }
        } catch (err) {
            console.error('Error fetching forum:', err);
        }
    }, [groupId]);

    const fetchThreads = useCallback(async (page = 1, limit = 20) => {
        if (!groupId) return;
        
        setLoading(true);
        setError(null);
        try {
            const response = await forumService.getGroupThreads(groupId, page, limit);
            setThreads(response.data || []);
            return response.data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    const createThread = useCallback(async (threadData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await forumService.createThread(groupId, threadData);
            await fetchThreads(); // Refresh threads list
            return response.data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [groupId, fetchThreads]);

    const deleteThread = useCallback(async (threadId) => {
        setLoading(true);
        setError(null);
        try {
            await forumService.deleteThread(threadId);
            await fetchThreads(); // Refresh threads list
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchThreads]);

    const toggleThreadStatus = useCallback(async (threadId, close) => {
        setLoading(true);
        setError(null);
        try {
            await forumService.toggleThreadStatus(threadId, close);
            await fetchThreads(); // Refresh threads list
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchThreads]);

    return {
        threads,
        forum,
        loading,
        error,
        fetchForum,
        fetchThreads,
        createThread,
        deleteThread,
        toggleThreadStatus
    };
}

export function useThread(threadId) {
    const [thread, setThread] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchThread = useCallback(async () => {
        if (!threadId) return;
        
        setLoading(true);
        setError(null);
        try {
            const response = await forumService.getThreadDetails(threadId);
            setThread(response.data);
            return response.data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [threadId]);

    const createComment = useCallback(async (contenido) => {
        setLoading(true);
        setError(null);
        try {
            await forumService.createComment(threadId, contenido);
            await fetchThread(); // Refresh thread with new comment
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [threadId, fetchThread]);

    const editComment = useCallback(async (commentId, contenido) => {
        setLoading(true);
        setError(null);
        try {
            await forumService.editComment(commentId, contenido);
            await fetchThread(); // Refresh thread
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchThread]);

    const deleteComment = useCallback(async (commentId) => {
        setLoading(true);
        setError(null);
        try {
            await forumService.deleteComment(commentId);
            await fetchThread(); // Refresh thread
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchThread]);

    return {
        thread,
        loading,
        error,
        fetchThread,
        createComment,
        editComment,
        deleteComment
    };
}
