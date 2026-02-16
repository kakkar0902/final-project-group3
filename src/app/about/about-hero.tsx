'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DEFAULT_TITLE = 'About Shoreline Woodworks';
const DEFAULT_TAGLINE = 'Learn all about us — our craft, materials, and services.';

type Props = {
  initialTitle: string | null;
  initialTagline: string | null;
  isAdmin: boolean;
};

export default function AboutHero({
  initialTitle,
  initialTagline,
  isAdmin,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(initialTitle ?? DEFAULT_TITLE);
  const [tagline, setTagline] = useState(initialTagline ?? DEFAULT_TAGLINE);

  const displayTitle = initialTitle ?? DEFAULT_TITLE;
  const displayTagline = initialTagline ?? DEFAULT_TAGLINE;

  async function handleSave() {
    setSaving(true);
    try {
      await Promise.all([
        fetch('/api/site-settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'about.pageTitle', value: title }),
        }),
        fetch('/api/site-settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'about.pageTagline', value: tagline }),
        }),
      ]);
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setTitle(initialTitle ?? DEFAULT_TITLE);
    setTagline(initialTagline ?? DEFAULT_TAGLINE);
    setEditing(false);
  }

  return (
    <div className="text-center mb-12">
      {editing ? (
        <div className="space-y-4 max-w-2xl mx-auto">
          <label htmlFor="about-hero-title" className="sr-only">
            Page title
          </label>
          <input
            id="about-hero-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-background border border-border rounded px-3 py-2 text-4xl font-bold text-center text-foreground"
            aria-label="Page title"
          />
          <label htmlFor="about-hero-tagline" className="sr-only">
            Tagline
          </label>
          <input
            id="about-hero-tagline"
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full bg-background border border-border rounded px-3 py-2 text-lg text-center text-foreground"
            aria-label="Tagline"
          />
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="bg-muted-foreground/20 text-foreground px-4 py-2 rounded-md hover:bg-muted-foreground/30 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <h1 className="text-4xl font-bold mb-4">{displayTitle}</h1>
          <p className="text-lg text-muted-foreground">{displayTagline}</p>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="mt-4 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              Edit
            </button>
          )}
        </>
      )}
    </div>
  );
}
