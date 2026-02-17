import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

export const AppProvider = ({ children }) => {
    const [kidsMode, setKidsMode] = useState(false);
    const [journeyTime, setJourneyTime] = useState(null);
    const [journeyStartTime, setJourneyStartTime] = useState(null);

    const toggleKidsMode = () => {
        setKidsMode(!kidsMode);
    };

    const startJourney = (duration) => {
        setJourneyTime(duration);
        setJourneyStartTime(Date.now());
    };

    const endJourney = () => {
        setJourneyTime(null);
        setJourneyStartTime(null);
    };

    const value = {
        kidsMode,
        toggleKidsMode,
        journeyTime,
        journeyStartTime,
        startJourney,
        endJourney
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
