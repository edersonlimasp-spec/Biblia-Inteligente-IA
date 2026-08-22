import { createContext, useContext, useEffect, useState } from "react";
import { setStatusBarStyle } from "@/lib/capacitor";

type Theme = "light" | "dark";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
  undefined
);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);

    // Sincroniza a cor da barra de status com o tema ESCOLHIDO no app.
    // O app Android publicado é um TWA, cuja barra de status segue a meta
    // `theme-color`. No index.html essa meta usa `prefers-color-scheme` (tema do
    // SISTEMA). Quando o sistema está no modo claro e o app no modo escuro, a
    // barra ficava branca (a "faixa branca" no topo). Aqui forçamos a meta a
    // refletir o tema real do app, removendo a dependência do tema do sistema.
    const color = theme === "dark" ? "#0A1420" : "#F2F5F8";
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    if (metas.length === 0) {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      meta.setAttribute("content", color);
      document.head.appendChild(meta);
    } else {
      metas.forEach((m) => {
        m.removeAttribute("media");
        m.setAttribute("content", color);
      });
    }

    void setStatusBarStyle(theme === "dark");
  }, [theme]);

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
