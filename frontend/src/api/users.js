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

export const usersAPI = {
    // Get all users (Admin only)
    getAll: () => {
        return axios.get(`${API_BASE_URL}/users/`, getAuthHeaders());
    },

    // Create a new user (Admin only)
    create: (userData) => {
        return axios.post(`${API_BASE_URL}/users/`, userData, getAuthHeaders());
    },

    // Update a user (Admin only)
    update: (userId, userData) => {
        return axios.put(`${API_BASE_URL}/users/${userId}`, userData, getAuthHeaders());
    },

    // Delete a user (Admin only)
    delete: (userId) => {
        return axios.delete(`${API_BASE_URL}/users/${userId}`, getAuthHeaders());
    }
};
