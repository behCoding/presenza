// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:8000'; 

// Auth endpoints
export const login = async (formData) => axios.post(`${API_URL}/token`, formData);
export const registerUser = async (data) => axios.post(`${API_URL}/register`, data);

// Presence endpoints
export const logDailyPresence = async (data, token) =>
  axios.post(`${API_URL}/presence`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const getMonthlyPresence = async (employeeId, month, year, token) =>
  axios.get(`${API_URL}/presence/${employeeId}`, {
    params: { month, year },
    headers: { Authorization: `Bearer ${token}` }
  });
