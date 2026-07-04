import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/** Redirects to /signin if not authenticated. Returns the user otherwise. */
export function useRequireAuth(redirectTo: string = "/signin") {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, redirectTo]);

  return user;
}

/**
 * Redirects authenticated users to /dashboard if they hit /signin or /signup.
 *
 * Only fires on initial mount to avoid racing with `navigate("/onboarding")` in
 * the sign-up submit handler. After a successful sign-in/sign-up, the caller
 * controls navigation imperatively.
 */
export function useRedirectIfAuthed(redirectTo: string = "/dashboard") {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ranOnceRef = useRef(false);

  useEffect(() => {
    if (ranOnceRef.current) return;
    if (user) {
      ranOnceRef.current = true;
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, redirectTo]);
}
