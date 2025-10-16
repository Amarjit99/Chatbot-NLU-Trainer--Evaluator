// API Configuration for frontend
// Automatically uses production URL when deployed, localhost for development

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default API_URL;
