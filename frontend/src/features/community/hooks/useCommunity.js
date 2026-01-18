import { useState, useCallback } from 'react';
import { announcementService, reportService } from '../services/communityService';

export function useAnnouncements(groupId) {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchAnnouncements = useCallback(async () => {
        if (!groupId) return;
        
        setLoading(true);
        setError(null);
        try {
            const response = await announcementService.getGroupAnnouncements(groupId);
            setAnnouncements(response.data || []);
            return response.data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    const createAnnouncement = useCallback(async (announcementData) => {
        setLoading(true);
        setError(null);
        try {
            await announcementService.createAnnouncement(groupId, announcementData);
            await fetchAnnouncements(); // Refresh list
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [groupId, fetchAnnouncements]);

    const updateAnnouncement = useCallback(async (announcementId, updateData) => {
        setLoading(true);
        setError(null);
        try {
            await announcementService.updateAnnouncement(announcementId, updateData);
            await fetchAnnouncements(); // Refresh list
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchAnnouncements]);

    const deleteAnnouncement = useCallback(async (announcementId) => {
        setLoading(true);
        setError(null);
        try {
            await announcementService.deleteAnnouncement(announcementId);
            await fetchAnnouncements(); // Refresh list
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchAnnouncements]);

    return {
        announcements,
        loading,
        error,
        fetchAnnouncements,
        createAnnouncement,
        updateAnnouncement,
        deleteAnnouncement
    };
}

export function useReports(groupId) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchReports = useCallback(async () => {
        if (!groupId) return;
        
        setLoading(true);
        setError(null);
        try {
            const response = await reportService.getGroupReports(groupId);
            setReports(response.data || []);
            return response.data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    const createReport = useCallback(async (reportData) => {
        setLoading(true);
        setError(null);
        try {
            await reportService.createReport(reportData);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const resolveReport = useCallback(async (reportId, resolution) => {
        setLoading(true);
        setError(null);
        try {
            await reportService.resolveReport(reportId, resolution);
            await fetchReports(); // Refresh list
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchReports]);

    return {
        reports,
        loading,
        error,
        fetchReports,
        createReport,
        resolveReport
    };
}
