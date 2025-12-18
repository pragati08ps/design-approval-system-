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

export const tasksAPI = {
    // Get all tasks
    getAll: () => {
        return axios.get(`${API_BASE_URL}/tasks/`, getAuthHeaders());
    },

    // Create a new task
    create: (taskData) => {
        return axios.post(`${API_BASE_URL}/tasks/`, taskData, getAuthHeaders());
    },

    // Update a task
    update: (taskId, taskData) => {
        return axios.put(`${API_BASE_URL}/tasks/${taskId}`, taskData, getAuthHeaders());
    },

    // Delete a task
    delete: (taskId) => {
        return axios.delete(`${API_BASE_URL}/tasks/${taskId}`, getAuthHeaders());
    },

    // Upload task file
    uploadFile: (taskId, file) => {
        const formData = new FormData();
        formData.append('file', file);

        const token = localStorage.getItem('token');
        return axios.post(`${API_BASE_URL}/tasks/${taskId}/upload`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    // Toggle timer (start/pause)
    toggleTimer: (taskId, action) => {
        return axios.post(`${API_BASE_URL}/tasks/${taskId}/timer?action=${action}`, {}, getAuthHeaders());
    }
};
