import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "./ui/button";
import { useTheme } from "./theme-provider";

export const ThemeToggle = () => {
	const { theme, toggleTheme } = useTheme();
	const { t } = useTranslation();

	return (
		<Button
			aria-label={theme === "light" ? t("theme.dark") : t("theme.light")}
			className="h-9 w-9 rounded-lg p-0"
			onClick={toggleTheme}
			variant="ghost"
		>
			{theme === "light" ? (
				<Moon className="h-4 w-4" />
			) : (
				<Sun className="h-4 w-4" />
			)}
		</Button>
	);
};
