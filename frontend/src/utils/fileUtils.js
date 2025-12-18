import axios from '../api/axios';

/**
 * Download file with authentication
 */
export const downloadFile = async (fileId, filename) => {
    try {
        const response = await axios.get(`/uploads/${fileId}`, {
            responseType: 'blob', // Important for file download
        });

        // Create blob URL and trigger download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download failed:', error);
        throw error;
    }
};

/**
 * Preview file in new tab with authentication
 */
export const previewFile = async (fileId, filename) => {
    try {
        const response = await axios.get(`/uploads/preview/${fileId}`, {
            responseType: 'blob',
        });

        // Create blob URL and open in new tab
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = window.URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');

        // Cleanup after window is opened
        if (newWindow) {
            newWindow.onload = () => {
                window.URL.revokeObjectURL(url);
            };
        }
    } catch (error) {
        console.error('Preview failed:', error);
        throw error;
    }
};

/**
 * Get file blob URL for embedding (e.g., in iframe or img)
 */
export const getFileBlobUrl = async (fileId) => {
    try {
        const response = await axios.get(`/uploads/preview/${fileId}`, {
            responseType: 'blob',
        });

        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        return window.URL.createObjectURL(blob);
    } catch (error) {
        console.error('Failed to get blob URL:', error);
        throw error;
    }
};
