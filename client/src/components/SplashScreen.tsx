import splashBg from "@assets/generated_images/Splash_screen_background_gradient_2ee3e811.png";
import appLogo from "@assets/generated_images/App_logo_biblical_metallic_blue_695d5d1c.png";

export function SplashScreen() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        backgroundImage: `url(${splashBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      data-testid="screen-splash"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/60" />
      <div className="relative z-10 flex flex-col items-center gap-6 px-4">
        <img
          src={appLogo}
          alt="Logo"
          className="w-24 h-24 animate-pulse"
          data-testid="img-splash-logo"
        />
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-white text-center tracking-tight">
          Bíblia Hebraico & Grego
        </h1>
        <p className="text-white/90 text-base font-medium">
          Primeiros Textos + IA
        </p>
      </div>
    </div>
  );
}
