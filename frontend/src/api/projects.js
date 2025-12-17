import axios from './axios';

export const projectsAPI = {
    getAll: () => axios.get('/projects'),
    getById: (id) => axios.get(`/projects/${id}`),
    create: (data) => axios.post('/projects', data),
    uploadContent: (projectId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return axios.post(`/projects/${projectId}/upload-content`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    uploadDesign: (projectId, designType, file) => {
        const formData = new FormData();
        formData.append('design_type', designType);
        formData.append('file', file);
        return axios.post(`/projects/${projectId}/upload-design`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    approveOrReject: (projectId, action, remark = null) =>
        axios.post(`/projects/${projectId}/approve-reject`, { action, remark }),
    updatePosting: (projectId, posted) =>
        axios.patch(`/projects/${projectId}/posting`, { posted })
};
