/* eslint-disable react-refresh/only-export-components */
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
    
    // Session Timer State
    const [sessionActive, setSessionActive] = useState(false);
    const [sessionDuration, setSessionDuration] = useState(0); // in seconds
    const [sessionJourneyName, setSessionJourneyName] = useState('');
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const [showTimeUpModal, setShowTimeUpModal] = useState(false);

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

    // Session Timer Methods
    const startSession = (durationMinutes, journeyName = '') => {
        setSessionActive(true);
        setSessionDuration(durationMinutes * 60); // convert to seconds
        setSessionJourneyName(journeyName);
        setSessionStartTime(Date.now());
        setShowTimeUpModal(false);
    };

    const endSession = () => {
        setSessionActive(false);
        setSessionDuration(0);
        setSessionJourneyName('');
        setSessionStartTime(null);
        setShowTimeUpModal(false);
    };

    const showTimeUpAlert = () => {
        setSessionActive(false);
        setShowTimeUpModal(true);
    };

    const value = {
        kidsMode,
        toggleKidsMode,
        journeyTime,
        journeyStartTime,
        startJourney,
        endJourney,
        // Session Timer
        sessionActive,
        sessionDuration,
        sessionJourneyName,
        sessionStartTime,
        showTimeUpModal,
        startSession,
        endSession,
        showTimeUpAlert,
        setShowTimeUpModal,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
