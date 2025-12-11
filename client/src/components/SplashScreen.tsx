import splashFullScreen from "@assets/logo/splash.png";
import appLogo from "@assets/logo/logo.png";

export function SplashScreen() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-background"
      data-testid="screen-splash"
    >
      <div className="flex flex-col items-center gap-8 px-4">
        <img
          src={appLogo}
          alt="Bíblia Inteligente"
          className="w-40 h-40 md:w-56 md:h-56"
          data-testid="img-splash-logo"
        />
      </div>
    </div>
  );
}
