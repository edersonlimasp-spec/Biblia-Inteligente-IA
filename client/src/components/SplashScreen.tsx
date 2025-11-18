import splashFullScreen from "@assets/logo/splash.png";
import appLogo from "@assets/logo/logo.png";

export function SplashScreen() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-primary"
      style={{
        backgroundImage: `url(${splashFullScreen})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      data-testid="screen-splash"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/10 to-primary/30" />
      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        <div className="relative">
          <div className="absolute inset-0 blur-2xl opacity-50 bg-white/20 rounded-full" />
          <img
            src={appLogo}
            alt="Bíblia Hebraico & Grego"
            className="relative w-32 h-32 md:w-40 md:h-40 animate-pulse drop-shadow-2xl"
            data-testid="img-splash-logo"
          />
        </div>
        <div className="text-center space-y-3">
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-white tracking-tight drop-shadow-lg">
            Bíblia Hebraico & Grego
          </h1>
          <p className="text-white/95 text-lg md:text-xl font-medium drop-shadow-md">
            Primeiros Textos + IA
          </p>
        </div>
      </div>
    </div>
  );
}
