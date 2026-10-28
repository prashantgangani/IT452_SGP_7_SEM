import api from './authApi';

export const getPendingKyc = async () => {
    try {
        const response = await api.get('/admin/kyc/pending');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch pending KYC requests';
    }
};

export const getPendingLenderKyc = async () => {
    try {
        const response = await api.get('/admin/lender/kyc/pending');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch pending Lender KYC requests';
    }
};

export const approveKyc = async (id) => {
    try {
        const response = await api.post(`/admin/kyc/${id}/approve`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to approve KYC';
    }
};

export const rejectKyc = async (id, adminRemark) => {
    try {
        const response = await api.post(`/admin/kyc/${id}/reject`, { adminRemark });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to reject KYC';
    }
};

export const getAdminStats = async () => {
    try {
        const response = await api.get('/admin/stats');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch admin stats';
    }
};

export const approveLenderKyc = async (id) => {
    try {
        const response = await api.patch(`/admin/lender/${id}/approve`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to approve Lender KYC';
    }
};

export const rejectLenderKyc = async (id, adminRemark) => {
    try {
        const response = await api.patch(`/admin/lender/${id}/reject`, { adminRemark });
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to reject Lender KYC';
    }
};

export const verifyLenderChecklist = async (id, checklistData) => {
    try {
        const response = await api.patch(`/admin/lender/${id}/verify`, checklistData);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to verify lender';
    }
};

export const getAllDeals = async () => {
    try {
        const response = await api.get('/admin/deals');
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || 'Failed to fetch deals';
    }
};

const getAdminCollection = async (path, message) => {
    try {
        const response = await api.get(path);
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || message;
    }
};

export const getAllUsers = () => getAdminCollection('/admin/users', 'Failed to fetch users');
export const getAllInvoices = () => getAdminCollection('/admin/invoices', 'Failed to fetch invoices');
export const getAllBids = () => getAdminCollection('/admin/bids', 'Failed to fetch bids');
export const getAllTransactions = () => getAdminCollection('/admin/transactions', 'Failed to fetch transactions');
export const getRiskAlerts = () => getAdminCollection('/admin/alerts', 'Failed to fetch risk alerts');
