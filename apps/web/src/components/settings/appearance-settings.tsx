import { Check, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  const themes = [
    {
      id: "light",
      label: "Light",
      description: "Clean and bright interface",
      icon: Sun,
    },
    {
      id: "dark",
      label: "Dark",
      description: "Easy on the eyes in low light",
      icon: Moon,
    },
    {
      id: "system",
      label: "System",
      description: "Automatically match your system preference",
      icon: Sun,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-2xl">Appearance</h2>
        <p className="text-muted-foreground text-sm">
          Customize how GK-Nexus looks on your device
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Select your preferred color scheme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Color Theme</Label>
            <div className="grid gap-3 md:grid-cols-3">
              {themes.map((themeOption) => {
                const Icon = themeOption.icon;
                const isActive = theme === themeOption.id;

                return (
                  <button
                    className={cn(
                      "relative flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all hover:bg-muted",
                      isActive ? "border-primary bg-primary/5" : "border-border"
                    )}
                    key={themeOption.id}
                    onClick={() => setTheme(themeOption.id)}
                    type="button"
                  >
                    {!!isActive && (
                      <div className="absolute top-2 right-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{themeOption.label}</p>
                      <p className="text-muted-foreground text-xs">
                        {themeOption.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <div className="rounded bg-primary/10 p-2">
                <Sun className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-medium text-sm">Theme Preference</p>
                <p className="text-muted-foreground text-xs">
                  Your theme preference is saved locally and will persist across
                  sessions. The system theme option will automatically update
                  based on your operating system's color scheme.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            See how your theme looks across different components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="h-4 w-1/3 rounded bg-foreground" />
                <div className="h-3 w-2/3 rounded bg-muted-foreground" />
              </div>
              <div className="flex gap-2">
                <Button size="sm">Primary</Button>
                <Button size="sm" variant="outline">
                  Outline
                </Button>
                <Button size="sm" variant="ghost">
                  Ghost
                </Button>
              </div>
              <div className="rounded border p-3">
                <p className="text-sm">
                  This is a preview of how cards and containers will appear with
                  your selected theme.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
