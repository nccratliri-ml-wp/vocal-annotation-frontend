import React, { createContext, useState, useContext } from 'react';

const ScrollContext = createContext();

export function ScrollProvider({ children }) {
    const [scrollEnabled, setScrollEnabled] = useState(true);

    return (
        <ScrollContext.Provider value={{ scrollEnabled, setScrollEnabled }}>
            {children}
        </ScrollContext.Provider>
    );
}

export function useScroll() {
    const context = useContext(ScrollContext);
    if (context === undefined) {
        throw new Error('useScroll must be used within a ScrollProvider');
    }
    return context;
}