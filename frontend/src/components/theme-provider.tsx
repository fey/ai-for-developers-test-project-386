import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
	theme: Theme;
	toggleTheme: () => void;
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "theme-preference";

interface ThemeProviderProps {
	children: ReactNode;
	defaultTheme?: Theme;
}

export const ThemeProvider = ({
	children,
	defaultTheme = "light",
}: ThemeProviderProps) => {
	const [theme, setThemeState] = useState<Theme>(() => {
		if (typeof window === "undefined") return defaultTheme;

		// Check localStorage first
		const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
		if (stored && (stored === "light" || stored === "dark")) {
			return stored;
		}

		// Fall back to system preference
		if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
			return "dark";
		}

		return defaultTheme;
	});

	useEffect(() => {
		const root = document.documentElement;

		if (theme === "dark") {
			root.classList.add("dark");
		} else {
			root.classList.remove("dark");
		}

		// Persist preference
		try {
			localStorage.setItem(STORAGE_KEY, theme);
		} catch {
			// Ignore storage errors (e.g., private mode)
		}
	}, [theme]);

	// Listen for system preference changes
	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

		const handleChange = (e: MediaQueryListEvent) => {
			// Only apply system preference if user hasn't manually set a preference
			const stored = localStorage.getItem(STORAGE_KEY);
			if (!stored) {
				setThemeState(e.matches ? "dark" : "light");
			}
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	const toggleTheme = () => {
		setThemeState((prev) => (prev === "light" ? "dark" : "light"));
	};

	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme);
	};

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = (): ThemeContextValue => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
};
