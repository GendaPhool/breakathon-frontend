import { useState, useEffect } from "react";
import { getMarshalSession, setMarshalSession, clearMarshalSession } from "@/lib/marshalSession";
import MarshalGate from "@/pages/MarshalGate";

export default function MarshalGateWrapper({ children }) {
  const [session, setSession] = useState(() => getMarshalSession());

  const login = (data) => {
    setMarshalSession(data);
    setSession(data);
  };

  const logout = () => {
    clearMarshalSession();
    setSession(null);
  };

  if (!session) {
    return <MarshalGate onSuccess={login} />;
  }

  return children;
}