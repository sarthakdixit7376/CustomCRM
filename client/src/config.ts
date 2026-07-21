import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:4000' : 'https://customcrm.up.railway.app');

// Send the httpOnly auth cookie with every request.
axios.defaults.withCredentials = true;
