import { createContext, useContext, useState, useCallback } from "react";
import { getParticipantSession, setParticipantSession, clearParticipantSession } from "@/lib/participantSession";

const ParticipantContext = createContext(null);

export function ParticipantSessionProvider({ children }) {
  const [session, setSession] = useState(() => getParticipantSession());

  const login = useCallback((data) => {
    setParticipantSession(data);
    setSession(data);
  }, []);

  const logout = useCallback(() => {
    clearParticipantSession();
    setSession(null);
  }, []);

  return (
    <ParticipantContext.Provider value={{ session, login, logout }}>
      {children}
    </ParticipantContext.Provider>
  );
}

export function useParticipantSession() {
  return useContext(ParticipantContext);
}