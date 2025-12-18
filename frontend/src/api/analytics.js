import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

export const analyticsAPI = {
    // Get dashboard analytics
    getDashboard: () => {
        return axios.get(`${API_BASE_URL}/analytics/dashboard`, getAuthHeaders());
    },

    // Get projects timeline
    getTimeline: (days = 30) => {
        return axios.get(`${API_BASE_URL}/analytics/projects/timeline?days=${days}`, getAuthHeaders());
    },

    // Get user performance
    getUserPerformance: (userId) => {
        return axios.get(`${API_BASE_URL}/analytics/performance/user/${userId}`, getAuthHeaders());
    }
};
