'use client';

import { useSession, signOut } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import ProjectUploadForm from '@/components/ProjectUploadForm';
import ProjectList from '@/components/ProjectList';

interface Project {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  category: string | null;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

type TabType = 'projects' | 'site-content' | 'settings';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Tab configuration
  const tabs = [
    { id: 'projects' as TabType, label: 'Projects & Photos', icon: '📸' },
    { id: 'site-content' as TabType, label: 'Site Content', icon: '📝' },
    { id: 'settings' as TabType, label: 'Settings', icon: '⚙️' },
  ];

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    redirect('/admin/login');
  }

  // Event handlers
  const handleProjectSuccess = () => {
    setEditingProject(null);
    setRefreshKey(prev => prev + 1); // Trigger ProjectList refresh
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
  };

  const handleLogout = async () => {
    await signOut({ 
      callbackUrl: '/admin/login',
      redirect: true 
    });
  };

  return (
    <div className="pt-16">
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Page Header with Logout Button */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-4 text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage your website content and settings
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-accent transition-colors shadow"
            >
              Logout
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-border">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${
                        activeTab === tab.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                      }
                    `}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <>
              {/* Upload Form Section */}
              <div className="mb-12">
                {editingProject && (
                  <button
                    onClick={handleCancelEdit}
                    className="mb-4 text-primary hover:text-accent font-medium transition-colors"
                  >
                    ← Cancel editing
                  </button>
                )}
                <ProjectUploadForm 
                  onSuccess={handleProjectSuccess}
                  editProject={editingProject}
                />
              </div>

              {/* Project List Section */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  All Projects
                </h2>
                <ProjectList 
                  key={refreshKey}  // Force re-render when refreshKey changes
                  onEdit={handleEdit}
                />
              </div>
            </>
          )}

          {/* Site Content Tab */}
          {activeTab === 'site-content' && (
            <div className="bg-card rounded-xl shadow-md p-8 text-center border border-border">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Site Content Editor
              </h3>
              <p className="text-muted-foreground mb-4">
                Edit landing page text, hero section, and feature image
              </p>
              <p className="text-sm text-muted-foreground italic">
                Coming soon...
              </p>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-card rounded-xl shadow-md p-8 text-center border border-border">
              <div className="text-6xl mb-4">⚙️</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                General Settings
              </h3>
              <p className="text-muted-foreground mb-4">
                Configure site settings and preferences
              </p>
              <p className="text-sm text-muted-foreground italic">
                Coming soon...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
