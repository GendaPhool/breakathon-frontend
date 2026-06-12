import { useParticipantSession } from "@/components/ParticipantSessionProvider";
import ParticipantGate from "@/pages/ParticipantGate";

export default function ParticipantGateWrapper({ children }) {
  const { session, login } = useParticipantSession();

  if (!session) {
    return <ParticipantGate onSuccess={login} />;
  }

  return children;
}