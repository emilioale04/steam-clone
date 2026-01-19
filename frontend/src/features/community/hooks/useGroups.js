import { useState, useCallback } from 'react';
import { groupService } from '../services/groupService';

export function useGroups() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchMyGroups = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await groupService.getMyGroups();
            setGroups(response.data || []);
            return response.data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const searchGroups = useCallback(async (searchTerm) => {
        setLoading(true);
        setError(null);
        try {
            const response = await groupService.searchGroups(searchTerm);
            setGroups(response.data || []);
            return response.data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createGroup = useCallback(async (groupData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await groupService.createGroup(groupData);
            return response.data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const joinGroup = useCallback(async (groupId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await groupService.joinGroup(groupId);
            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const leaveGroup = useCallback(async (groupId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await groupService.leaveGroup(groupId);
            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        groups,
        loading,
        error,
        fetchMyGroups,
        searchGroups,
        createGroup,
        joinGroup,
        leaveGroup
    };
}

export function useGroupDetails(groupId) {
    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchGroupDetails = useCallback(async () => {
        if (!groupId) return;
        
        setLoading(true);
        setError(null);
        try {
            const response = await groupService.getGroupDetails(groupId);
            setGroup(response.data);
            return response.data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    const fetchMembers = useCallback(async () => {
        if (!groupId) return;
        
        setLoading(true);
        setError(null);
        try {
            const response = await groupService.getGroupMembers(groupId);
            setMembers(response.data || []);
            return response.data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    const fetchPendingRequests = useCallback(async () => {
        if (!groupId) return;
        
        setLoading(true);
        setError(null);
        try {
            const response = await groupService.getPendingRequests(groupId);
            setPendingRequests(response.data || []);
            return response.data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    const updateGroup = useCallback(async (updateData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await groupService.updateGroup(groupId, updateData);
            setGroup(response.data);
            return response.data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    const updateMemberRole = useCallback(async (memberId, role) => {
        setLoading(true);
        setError(null);
        try {
            await groupService.updateMemberRole(groupId, memberId, role);
            await fetchMembers(); // Refresh members list
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [groupId, fetchMembers]);

    const toggleMemberBan = useCallback(async (memberId, ban) => {
        setLoading(true);
        setError(null);
        try {
            await groupService.toggleMemberBan(groupId, memberId, ban);
            await fetchMembers(); // Refresh members list
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [groupId, fetchMembers]);

    const inviteUser = useCallback(async (targetUserId) => {
        setLoading(true);
        setError(null);
        try {
            await groupService.inviteUser(groupId, targetUserId);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    const handleJoinRequest = useCallback(async (requestId, approve) => {
        setLoading(true);
        setError(null);
        try {
            await groupService.handleJoinRequest(groupId, requestId, approve);
            await fetchPendingRequests(); // Refresh pending requests
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [groupId, fetchPendingRequests]);

    const deleteGroup = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            await groupService.deleteGroup(groupId);
            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    return {
        group,
        members,
        pendingRequests,
        loading,
        error,
        fetchGroupDetails,
        fetchMembers,
        fetchPendingRequests,
        updateGroup,
        updateMemberRole,
        toggleMemberBan,
        inviteUser,
        handleJoinRequest,
        deleteGroup
    };
}
