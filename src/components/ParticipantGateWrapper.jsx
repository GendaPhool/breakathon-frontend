import { Navigate } from "react-router-dom";
import { useParticipantSession } from "@/components/ParticipantSessionProvider";

export default function ParticipantGateWrapper({ children }) {
  const { session } = useParticipantSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
