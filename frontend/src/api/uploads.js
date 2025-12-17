import axios from './axios';

export const uploadsAPI = {
    download: (fileId) => axios.get(`/uploads/${fileId}`, { responseType: 'blob' }),
    preview: (fileId) => axios.get(`/uploads/preview/${fileId}`, { responseType: 'blob' }),
    getVersions: (projectId) => axios.get(`/uploads/project/${projectId}/versions`)
};
