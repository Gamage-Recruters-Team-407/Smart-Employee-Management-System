import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const ERROR_MESSAGES = {
  google_denied: "Google sign-in was cancelled.",
  google_invalid_state: "Google sign-in session expired. Please try again.",
  google_auth_failed: "Google sign-in failed. Please try again.",
};

export default function GoogleAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const error = params.get("error");
    if (error) {
      const message = ERROR_MESSAGES[error] || "Google sign-in failed.";
      navigate(`/login?error=${encodeURIComponent(message)}`, { replace: true });
      return;
    }

    const token = params.get("token");
    const userRaw = params.get("user");

    if (!token || !userRaw) {
      navigate(
        `/login?error=${encodeURIComponent("Missing sign-in data from Google.")}`,
        { replace: true }
      );
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw));
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      window.location.replace("/");
    } catch {
      navigate(
        `/login?error=${encodeURIComponent("Could not complete Google sign-in.")}`,
        { replace: true }
      );
    }
  }, [navigate, params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-gray-600">Completing Google sign-in…</p>
      </div>
    </div>
  );
}
