import { Redirect } from "expo-router";

// remindu://auth/callback is the Google OAuth redirect. WebBrowser.openAuthSessionAsync
// consumes it; if Android also delivers it to the router, just go home.
export default function AuthCallback() {
  return <Redirect href="/" />;
}
