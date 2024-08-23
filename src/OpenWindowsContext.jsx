import React, { createContext, useState, useContext } from 'react';

const OpenWindowsContext = createContext();

export function OpenWindowsProvider({ children }) {
    const [anyWindowsOpen, setAnyWindowsOpen] = useState(false);

    return (
        <OpenWindowsContext.Provider value={{ anyWindowsOpen: anyWindowsOpen, setAnyWindowsOpen: setAnyWindowsOpen }}>
            {children}
        </OpenWindowsContext.Provider>
    );
}

export function useOpenWindowsContext() {
    const context = useContext(OpenWindowsContext);
    if (context === undefined) {
        throw new Error('useOpenWindowsContext must be used within a ScrollProvider');
    }
    return context;
}