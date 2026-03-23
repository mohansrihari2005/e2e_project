// filepath: src/services/api.js
// Centralized API service for all backend communication

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

class ApiClient {
  constructor() {
    this.baseURL = API_URL;
    this.token = this._loadToken();
  }

  _loadToken() {
    try {
      const session = localStorage.getItem("complaint-platform-session");
      if (session) {
        const data = JSON.parse(session);
        return data.token;
      }
    } catch (error) {
      console.error("Failed to load token:", error);
    }
    return null;
  }

  _saveToken(token) {
    this.token = token;
  }

  _getHeaders(includeAuth = true) {
    const headers = {
      "Content-Type": "application/json",
    };
    
    if (includeAuth && this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async _handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      const error = new Error(data.error || `HTTP ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
  }

  // Authentication
  async login(email, password) {
    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: "POST",
      headers: this._getHeaders(false),
      body: JSON.stringify({ email, password }),
    });
    const data = await this._handleResponse(response);
    this._saveToken(data.token);
    return data;
  }

  async logout() {
    try {
      await fetch(`${this.baseURL}/api/auth/logout`, {
        method: "POST",
        headers: this._getHeaders(true),
      });
    } finally {
      this.token = null;
    }
  }

  // Health Check
  async healthCheck() {
    const response = await fetch(`${this.baseURL}/api/health`);
    return this._handleResponse(response);
  }

  // Complaints
  async createComplaint(complaintData) {
    const response = await fetch(`${this.baseURL}/api/complaints`, {
      method: "POST",
      headers: this._getHeaders(false),
      body: JSON.stringify(complaintData),
    });
    return this._handleResponse(response);
  }

  async listComplaints(email = null) {
    const url = new URL(`${this.baseURL}/api/complaints`);
    if (email) {
      url.searchParams.append("email", email);
    }
    
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this._getHeaders(false),
    });
    return this._handleResponse(response);
  }

  async getComplaint(referenceId) {
    const response = await fetch(`${this.baseURL}/api/complaints/${referenceId}`, {
      method: "GET",
      headers: this._getHeaders(false),
    });
    return this._handleResponse(response);
  }

  async updateComplaint(referenceId, updates) {
    const response = await fetch(`${this.baseURL}/api/complaints/${referenceId}`, {
      method: "PUT",
      headers: this._getHeaders(false),
      body: JSON.stringify(updates),
    });
    return this._handleResponse(response);
  }

  async submitFeedback(referenceId, rating, comment) {
    const response = await fetch(`${this.baseURL}/api/complaints/${referenceId}/feedback`, {
      method: "POST",
      headers: this._getHeaders(false),
      body: JSON.stringify({ rating, comment }),
    });
    return this._handleResponse(response);
  }

  async downloadReport(referenceId) {
    const response = await fetch(`${this.baseURL}/api/complaints/${referenceId}/report`, {
      method: "GET",
      headers: this._getHeaders(false),
    });
    
    if (!response.ok) {
      throw new Error("Failed to download report");
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${referenceId}_report.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Statistics
  async getUserStats(email) {
    const response = await fetch(`${this.baseURL}/api/stats/user/${email}`, {
      method: "GET",
      headers: this._getHeaders(false),
    });
    return this._handleResponse(response);
  }

  async getAdminStats() {
    const response = await fetch(`${this.baseURL}/api/stats/admin`, {
      method: "GET",
      headers: this._getHeaders(false),
    });
    return this._handleResponse(response);
  }

  async getAnalytics() {
    const response = await fetch(`${this.baseURL}/api/analytics`, {
      method: "GET",
      headers: this._getHeaders(false),
    });
    return this._handleResponse(response);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Helper function for hooks
export const createApiHook = (apiMethod) => {
  return async (...args) => {
    try {
      const result = await apiMethod(...args);
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  };
};
