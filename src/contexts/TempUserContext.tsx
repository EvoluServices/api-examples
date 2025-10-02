import { createContext, useContext, useState, ReactNode } from 'react';
import { CognitoUser } from 'amazon-cognito-identity-js';

type TempUserContextType = {
    tempUser: CognitoUser | null;
    setTempUser: (user: CognitoUser | null) => void;
};

const TempUserContext = createContext<TempUserContextType | undefined>(
    undefined
);

export function TempUserProvider({ children }: { children: ReactNode }) {
    const [tempUser, setTempUser] = useState<CognitoUser | null>(null);

    return (
        <TempUserContext.Provider value={{ tempUser, setTempUser }}>
            {children}
        </TempUserContext.Provider>
    );
}

export function useTempUser() {
    const context = useContext(TempUserContext);
    if (!context)
        throw new Error('useTempUser must be used within a TempUserProvider');
    return context;
}