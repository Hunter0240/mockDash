import { memo, useCallback, useEffect, useRef, useState } from "react";

const CHART_LABELS = [
  "Primary",
  "Secondary",
];

const CHART_VARS = [
  "--color-chart-1",
  "--color-chart-2",
];

interface SettingsPanelProps {
  theme: string;
  dark: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  chartColors: string[] | null;
  onThemeChange: (theme: string) => void;
  onDarkChange: (dark: boolean) => void;
  onReducedMotionChange: (v: boolean) => void;
  onHighContrastChange: (v: boolean) => void;
  onChartColorsChange: (colors: string[] | null) => void;
}

function oklchToHex(oklch: string): string {
  const el = document.createElement("div");
  el.style.color = oklch;
  document.body.appendChild(el);
  const computed = getComputedStyle(el).color;
  document.body.removeChild(el);
  const match = computed.match(/(\d+)/g);
  if (!match || match.length < 3) return "#888888";
  return (
    "#" +
    match
      .slice(0, 3)
      .map((v) => Number(v).toString(16).padStart(2, "0"))
      .join("")
  );
}

function readChartColors(): string[] {
  const style = getComputedStyle(document.documentElement);
  return CHART_VARS.map((v) => {
    const raw = style.getPropertyValue(v).trim();
    return raw ? oklchToHex(raw) : "#888888";
  });
}

export const SettingsPanel = memo(function SettingsPanel({
  theme,
  dark,
  reducedMotion,
  highContrast,
  chartColors,
  onThemeChange,
  onDarkChange,
  onReducedMotionChange,
  onHighContrastChange,
  onChartColorsChange,
}: SettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [colors, setColors] = useState<string[]>(() => chartColors ?? readChartColors());
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartColors) {
      setColors(chartColors);
    } else {
      requestAnimationFrame(() => setColors(readChartColors()));
    }
  }, [theme, dark, chartColors]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleColorChange = useCallback((index: number, hex: string) => {
    setColors((prev) => {
      const next = [...prev];
      next[index] = hex;
      onChartColorsChange(next);
      return next;
    });
  }, [onChartColorsChange]);

  const handleResetColors = useCallback(() => {
    onChartColorsChange(null);
    requestAnimationFrame(() => setColors(readChartColors()));
  }, [onChartColorsChange]);

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Settings"
        aria-label="Settings"
        aria-expanded={open}
        className="btn-icon rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)] focus:ring-offset-1 inline-flex items-center justify-center"
        style={{
          width: "36px",
          height: "36px",
          fontSize: "var(--text-md)",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 rounded-lg border overflow-hidden"
          style={{
            top: "calc(100% + var(--space-sm))",
            backgroundColor: "var(--color-surface-raised)",
            borderColor: "var(--color-border)",
            width: "280px",
            maxWidth: "calc(100vw - 2rem)",
            zIndex: 50,
            boxShadow: "0 4px 24px oklch(0 0 0 / 0.12)",
          }}
          role="dialog"
          aria-label="Settings"
        >
          <div style={{ padding: "var(--space-md) var(--space-lg)" }}>
            <Section title="Appearance">
              <Field label="Theme">
                <select
                  value={theme}
                  onChange={(e) => onThemeChange(e.target.value)}
                  className="w-full rounded border focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
                  style={{
                    backgroundColor: "var(--color-surface-sunken)",
                    borderColor: "var(--color-border)",
                    fontSize: "var(--text-sm)",
                    padding: "var(--space-xs) var(--space-sm)",
                  }}
                >
                  <option value="slate">Slate</option>
                  <option value="stone">Stone</option>
                  <option value="carbon">Carbon</option>
                </select>
              </Field>
              <Field label="Mode">
                <div className="flex" style={{ gap: "var(--space-sm)" }}>
                  <ModeButton active={!dark} onClick={() => onDarkChange(false)}>
                    Light
                  </ModeButton>
                  <ModeButton active={dark} onClick={() => onDarkChange(true)}>
                    Dark
                  </ModeButton>
                </div>
              </Field>
            </Section>

            <Divider />

            <Section title="Data colors">
              <div
                className="grid"
                style={{
                  gridTemplateColumns: "1fr 1fr",
                  gap: "var(--space-sm)",
                }}
              >
                {CHART_LABELS.map((label, i) => (
                  <label
                    key={i}
                    className="flex items-center cursor-pointer"
                    style={{ gap: "var(--space-sm)", fontSize: "var(--text-xs)" }}
                  >
                    <span className="relative rounded focus-within:ring-2 focus-within:ring-[var(--color-focus)] focus-within:ring-offset-1" style={{ width: "24px", height: "24px", flexShrink: 0 }}>
                      <span
                        className="block rounded"
                        style={{
                          width: "24px",
                          height: "24px",
                          backgroundColor: `var(${CHART_VARS[i]})`,
                          border: "1px solid var(--color-border)",
                        }}
                      />
                      <input
                        type="color"
                        value={colors[i]}
                        onChange={(e) => handleColorChange(i, e.target.value)}
                        className="absolute inset-0 cursor-pointer focus:outline-none"
                        style={{ opacity: 0, width: "100%", height: "100%" }}
                      />
                    </span>
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
              <button
                onClick={handleResetColors}
                className="btn-icon w-full rounded"
                style={{
                  fontSize: "var(--text-xs)",
                  padding: "var(--space-xs) 0",
                  marginTop: "var(--space-sm)",
                }}
              >
                Reset to theme defaults
              </button>
            </Section>

            <Divider />

            <Section title="Accessibility">
              <Toggle
                label="Reduce motion"
                checked={reducedMotion}
                onChange={onReducedMotionChange}
              />
              <Toggle
                label="High contrast"
                checked={highContrast}
                onChange={onHighContrastChange}
              />
            </Section>
          </div>
        </div>
      )}
    </div>
  );
});

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ padding: "var(--space-sm) 0" }}>
      <h3
        className="font-medium uppercase tracking-wide"
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--color-text-muted)",
          marginBottom: "var(--space-sm)",
        }}
      >
        {title}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ gap: "var(--space-md)" }}
    >
      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
        {label}
      </span>
      <div className="flex-1" style={{ maxWidth: "140px" }}>
        {children}
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
      style={{
        fontSize: "var(--text-xs)",
        padding: "var(--space-xs) var(--space-sm)",
        backgroundColor: active
          ? "var(--color-text)"
          : "var(--color-surface-sunken)",
        color: active ? "var(--color-surface)" : "var(--color-text-secondary)",
        border: active ? "none" : "1px solid var(--color-border)",
        transition: "background-color 150ms ease-out, color 150ms ease-out",
      }}
    >
      {children}
    </button>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className="flex items-center justify-between cursor-pointer"
    >
      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
        {label}
      </span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)] focus:ring-offset-1"
        style={{
          width: "36px",
          height: "20px",
          backgroundColor: checked
            ? "var(--color-focus)"
            : "var(--color-border)",
          transition: "background-color 150ms ease-out",
        }}
      >
        <span
          className="block rounded-full"
          style={{
            width: "16px",
            height: "16px",
            backgroundColor: "var(--color-surface-raised)",
            transform: checked ? "translateX(18px)" : "translateX(2px)",
            transition: "transform 150ms ease-out",
            marginTop: "2px",
          }}
          aria-hidden="true"
        />
      </button>
    </label>
  );
}

function Divider() {
  return (
    <hr
      style={{
        borderColor: "var(--color-border-subtle)",
        margin: "var(--space-xs) 0",
      }}
    />
  );
}
