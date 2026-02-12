'use client';

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

export default function ProjectsTab() {
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleProjectSuccess = () => {
    setEditingProject(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
  };

  return (
    <>
      <div className="mb-8 sm:mb-12">
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

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">
          All Projects
        </h2>
        <ProjectList 
          key={refreshKey}
          onEdit={handleEdit}
        />
      </div>
    </>
  );
}