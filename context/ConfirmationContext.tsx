import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ConfirmationOptions {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

interface ConfirmationContextType {
    showConfirmation: (options: ConfirmationOptions) => void;
    hideConfirmation: () => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
    const { colorScheme } = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [visible, setVisible] = useState(false);
    const [options, setOptions] = useState<ConfirmationOptions | null>(null);

    const showConfirmation = useCallback((opts: ConfirmationOptions) => {
        setOptions(opts);
        setVisible(true);
    }, []);

    const hideConfirmation = useCallback(() => {
        setVisible(false);
        setOptions(null);
    }, []);

    const handleConfirm = () => {
        if (options?.onConfirm) {
            options.onConfirm();
        }
        hideConfirmation();
    };

    const handleCancel = () => {
        if (options?.onCancel) {
            options.onCancel();
        }
        hideConfirmation();
    };

    return (
        <ConfirmationContext.Provider value={{ showConfirmation, hideConfirmation }}>
            {children}
            {options && (
                <Modal
                    transparent
                    visible={visible}
                    animationType="fade"
                    onRequestClose={handleCancel}>
                    <View style={styles.overlay}>
                        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.title, { color: colors.text }]}>{options.title}</Text>
                            <Text style={[styles.message, { color: colors.text }]}>{options.message}</Text>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
                                    onPress={handleCancel}>
                                    <Text style={[styles.buttonText, { color: colors.text }]}>
                                        {options.cancelText || 'Cancelar'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.button, styles.confirmButton, { backgroundColor: colors.tint }]}
                                    onPress={handleConfirm}>
                                    <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                                        {options.confirmText || 'Confirmar'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </ConfirmationContext.Provider>
    );
}

export function useConfirmation() {
    const context = useContext(ConfirmationContext);
    if (context === undefined) {
        throw new Error('useConfirmation must be used within a ConfirmationProvider');
    }
    return context;
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    confirmButton: {

    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
