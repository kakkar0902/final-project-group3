'use client';

export default function SettingsTab() {
  return (
    <div className="bg-card rounded-xl shadow-md p-6 sm:p-8 text-center border border-border">
      <div className="text-5xl sm:text-6xl mb-4">⚙️</div>
      <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
        General Settings
      </h3>
      <p className="text-sm sm:text-base text-muted-foreground mb-4">
        Configure site settings and preferences
      </p>
      <p className="text-xs sm:text-sm text-muted-foreground italic">
        Coming soon...
      </p>
    </div>
  );
}