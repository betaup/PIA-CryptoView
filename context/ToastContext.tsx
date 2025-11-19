import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    hideToast: () => void;
    message: string | null;
    type: ToastType;
    visible: boolean;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [type, setType] = useState<ToastType>('info');
    const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((msg: string, t: ToastType = 'info') => {
        if (timer) clearTimeout(timer);
        setMessage(msg);
        setType(t);
        setVisible(true);

        const newTimer = setTimeout(() => {
            setVisible(false);
            setMessage(null);
        }, 3000);
        setTimer(newTimer);
    }, [timer]);

    const hideToast = useCallback(() => {
        setVisible(false);
        if (timer) clearTimeout(timer);
    }, [timer]);

    return (
        <ToastContext.Provider value={{ showToast, hideToast, message, type, visible }}>
            {children}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
