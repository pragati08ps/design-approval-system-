import axios from './axios';

export const authAPI = {
    register: (data) => axios.post('/auth/register', data),
    login: (data) => axios.post('/auth/login', data),
    getCurrentUser: () => axios.get('/auth/me')
};
