import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken) {
                setToken(storedToken);
                // Optimistically set user from storage if available
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }

                // Verify token and fetch fresh user data
                try {
                    const data = await getMe();
                    if (data && data.user) {
                        setUser(data.user);
                        localStorage.setItem('user', JSON.stringify(data.user));
                    }
                } catch (error) {
                    console.warn("Session verification failed (token expired or invalid):", error);
                    logout();
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = (newToken, newUser) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
