import { useAuth } from "@/lib/AuthContext";
import { Navigate } from "react-router-dom";

export default function Home() {
  const { user } = useAuth();
  const role = user?.role || "participant";

  if (role === "marshal") {
    return <Navigate to="/marshal/queue" replace />;
  }
  return <Navigate to="/submit" replace />;
}