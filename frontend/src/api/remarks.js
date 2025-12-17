import axios from './axios';

export const remarksAPI = {
    add: (data) => axios.post('/remarks', data),
    getByProject: (projectId) => axios.get(`/remarks/project/${projectId}`)
};
