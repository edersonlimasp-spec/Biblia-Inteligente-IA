import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Route, Switch, Router as WouterRouter, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AuthGateProvider } from "@/contexts/AuthGateContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { MainNavigation } from "@/components/MainNavigation";
import { DebugPanel, useDebugMode } from "@/components/DebugPanel";
import { hideSplashScreen, isNative } from "@/lib/capacitor";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

const clerkAppearance = {
  theme: shadcn,
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#9E3129",
    colorForeground: "#1B2634",
    colorMutedForeground: "#5D6470",
    colorDanger: "#B42318",
    colorBackground: "#F7F4EC",
    colorInput: "#FBF9F3",
    colorInputForeground: "#1B2634",
    colorNeutral: "#D9D2C3",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: { width: "100%", display: "flex", justifyContent: "center" },
    cardBox: { backgroundColor: "#F7F4EC", border: "1px solid #D9D2C3", borderRadius: "1rem", width: "440px", maxWidth: "100%", overflow: "hidden" },
    card: { boxShadow: "none", border: "0", backgroundColor: "transparent", borderRadius: "0" },
    footer: { boxShadow: "none", border: "0", backgroundColor: "transparent", borderRadius: "0" },
    headerTitle: { color: "#1B2634" }, headerSubtitle: { color: "#5D6470" },
    socialButtonsBlockButtonText: { color: "#1B2634" }, formFieldLabel: { color: "#1B2634" },
    footerActionLink: { color: "#9E3129" }, footerActionText: { color: "#5D6470" },
    dividerText: { color: "#5D6470" }, identityPreviewEditButton: { color: "#9E3129" },
    formFieldSuccessText: { color: "#166534" }, alertText: { color: "#1B2634" },
    logoBox: { paddingTop: "1.5rem" }, logoImage: { height: "3.5rem", width: "3.5rem" },
    socialButtonsBlockButton: { borderColor: "#D9D2C3", backgroundColor: "#FBF9F3" },
    formButtonPrimary: { backgroundColor: "#9E3129", color: "#FFF7F5" },
    formFieldInput: { borderColor: "#D9D2C3", backgroundColor: "#FBF9F3", color: "#1B2634" },
    footerAction: { backgroundColor: "transparent" }, dividerLine: { backgroundColor: "#D9D2C3" },
    alert: { borderColor: "#D9D2C3", backgroundColor: "#EFEBE2" }, otpCodeFieldInput: { color: "#1B2634" },
    formFieldRow: { color: "#1B2634" }, main: { color: "#1B2634" },
  },
};

function SignInPage() {
  return <div className="clerk-page flex min-h-[100dvh] items-center justify-center bg-background px-4">
    <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
  </div>;
}
function SignUpPage() {
  return <div className="clerk-page flex min-h-[100dvh] items-center justify-center bg-background px-4">
    <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
  </div>;
}
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previous = useRef<string | null | undefined>(undefined);
  useEffect(() => addListener(({ user }) => {
    const id = user?.id ?? null;
    if (previous.current !== undefined && previous.current !== id) client.clear();
    previous.current = id;
  }), [addListener, client]);
  return null;
}
function AppContent() {
  const isDebug = useDebugMode();
  const { isAdmin } = useAuth();
  useEffect(() => { hideSplashScreen(); }, []);
  return <><Toaster /><MainNavigation />{isDebug && isAdmin && <DebugPanel />}</>;
}
function NativeApp() {
  return <QueryClientProvider client={queryClient}>
    <TooltipProvider><AuthProvider><LanguageProvider><AuthGateProvider><AppContent /></AuthGateProvider></LanguageProvider></AuthProvider></TooltipProvider>
  </QueryClientProvider>;
}
function WebClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  const clerkPubKey = publishableKeyFromHost(
    window.location.hostname,
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  );
  const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
  if (!clerkPubKey) throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance}
    signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`}
    localization={{ signIn: { start: { title: "Boas-vindas de volta", subtitle: "Entre para acessar sua conta" } }, signUp: { start: { title: "Crie sua conta", subtitle: "Comece sua jornada hoje" } } }}
    routerPush={(to) => setLocation(stripBase(to))} routerReplace={(to) => setLocation(stripBase(to), { replace: true })}>
    <QueryClientProvider client={queryClient}>
      <ClerkQueryClientCacheInvalidator />
      <Switch>
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route><TooltipProvider><AuthProvider><LanguageProvider><AuthGateProvider><AppContent /></AuthGateProvider></LanguageProvider></AuthProvider></TooltipProvider></Route>
      </Switch>
    </QueryClientProvider>
  </ClerkProvider>;
}
export default function App() {
  if (isNative) return <NativeApp />;
  return <WouterRouter base={basePath}><WebClerkProviderWithRoutes /></WouterRouter>;
}