const SESSION_KEY = "bat_participant_session";

export function getParticipantSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setParticipantSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function clearParticipantSession() {
  localStorage.removeItem(SESSION_KEY);
}