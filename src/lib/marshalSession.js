const SESSION_KEY = "bat_marshal_session";

export function getMarshalSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setMarshalSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function clearMarshalSession() {
  localStorage.removeItem(SESSION_KEY);
}