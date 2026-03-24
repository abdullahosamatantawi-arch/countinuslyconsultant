import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Notification } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
    markAsRead: (id: string) => void;
    clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('recipient_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setNotifications(data.map(n => ({
                id: n.id,
                projectId: n.project_id,
                projectName: n.project_name,
                message: n.message,
                recipientId: n.recipient_id,
                isRead: n.is_read,
                timestamp: n.created_at
            })));
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Subscribe to new notifications
        const channel = supabase
            .channel('notifications-changes')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `recipient_id=eq."${user?.id}"`
            }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    const addNotification = async (n: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .insert({
                    project_id: n.projectId,
                    project_name: n.projectName,
                    message: n.message,
                    recipient_id: n.recipientId,
                    is_read: false
                });

            if (error) throw error;
        } catch (err) {
            console.error('Error adding notification:', err);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const clearNotifications = async () => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('recipient_id', user.id);

            if (error) throw error;
            setNotifications([]);
        } catch (err) {
            console.error('Error clearing notifications:', err);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, clearNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
