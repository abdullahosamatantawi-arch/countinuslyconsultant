import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { MOCK_USERS } from '../mocks/users';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string, role?: string) => Promise<{ success: boolean, error?: string }>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('mosque_app_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string, role?: string) => {
        // 1. Check Mock Users first
        const foundUser = MOCK_USERS.find(u => u.email === email && u.password === password);

        if (foundUser) {
            if (role && foundUser.role !== role) {
                return { success: false, error: 'هذا المستخدم ليس لديه صلاحية الدخول بهذه الرتبة' };
            }

            const { password: _, ...userWithoutPassword } = foundUser;
            setUser(userWithoutPassword);
            localStorage.setItem('mosque_app_user', JSON.stringify(userWithoutPassword));
            return { success: true };
        }

        // 2. Check Supabase DB for dynamic users
        try {
            const { data, error } = await supabase
                .from('app_users')
                .select('*')
                .eq('email', email)
                .eq('password', password)
                .single();

            if (data && !error) {
                if (role && data.role !== role) {
                    return { success: false, error: 'هذا المستخدم ليس لديه صلاحية الدخول بهذه الرتبة' };
                }

                const userData: User = {
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    role: data.role as any,
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=0d9488&color=fff`
                };

                setUser(userData);
                localStorage.setItem('mosque_app_user', JSON.stringify(userData));
                return { success: true };
            }
        } catch (dbErr) {
            console.error('DB Auth Error:', dbErr);
        }

        return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('mosque_app_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
