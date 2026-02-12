'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

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

interface ProjectUploadFormProps {
  onSuccess?: (project: Project) => void;
  editProject?: Project | null;
}

export default function ProjectUploadForm({ onSuccess, editProject }: ProjectUploadFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [featured, setFeatured] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Pre-fill form when in edit mode
  useEffect(() => {
    if (editProject) {
      setTitle(editProject.title);
      setDescription(editProject.description || '');
      setCategory(editProject.category || '');
      setFeatured(editProject.featured);
      setImagePreview(editProject.imageUrl);
      setRemoveImage(false);
    }
  }, [editProject]);

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setError('File size exceeds 10MB limit');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setImageFile(file);
    setRemoveImage(false);
    setError(null);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    
    // Clear file input
    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Create FormData object
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('featured', featured.toString());
      
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      if (removeImage) {
        formData.append('removeImage', 'true');
      }

      // Determine endpoint and method
      const endpoint = editProject 
        ? `/api/projects/${editProject.id}`
        : '/api/projects';
      const method = editProject ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save project');
      }

      const project = await response.json();
      
      setSuccess(true);
      
      // Call success callback
      if (onSuccess) {
        onSuccess(project);
      }

      // Reset form if creating (not editing)
      if (!editProject) {
        setTitle('');
        setDescription('');
        setCategory('');
        setFeatured(false);
        setImageFile(null);
        setImagePreview(null);
        setRemoveImage(false);
        
        // Clear file input
        const fileInput = document.getElementById('image') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-card rounded-xl shadow-md border border-border">
      <h2 className="text-2xl font-bold mb-6 text-foreground">
        {editProject ? 'Edit Project' : 'Upload New Project'}
      </h2>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-accent/10 border border-accent/20 text-accent rounded-lg">
          Project {editProject ? 'updated' : 'created'} successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Input */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
            placeholder="Enter project title"
          />
        </div>

        {/* Description Textarea */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
            placeholder="Enter project description (optional)"
          />
        </div>

        {/* Category Input */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
            Category
          </label>
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
            placeholder="e.g., Residential, Commercial, Landscape"
          />
        </div>

        {/* Featured Checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="featured"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="w-4 h-4 text-primary border-input rounded focus:ring-ring"
          />
          <label htmlFor="featured" className="ml-2 text-sm font-medium text-foreground">
            Mark as featured project
          </label>
        </div>

        {/* Image Upload Section */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Project Images
          </label>
          
          {imagePreview ? (
            <div className="relative inline-block">
              <div className="relative w-full max-w-md h-64 rounded-lg overflow-hidden border border-border">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors shadow-md"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="border-dashed border-2 border-border bg-muted rounded-lg p-8 text-center hover:border-primary transition-colors">
              <input
                type="file"
                id="image"
                onChange={handleImageChange}
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                className="hidden"
              />
              <label
                htmlFor="image"
                className="cursor-pointer inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-accent transition-colors shadow"
              >
                Click to upload images
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                JPEG, PNG, WebP, or GIF (max 10MB)
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !title}
          className="w-full py-3 px-6 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow"
        >
          {loading ? 'Saving...' : editProject ? 'Update Project' : 'Create Project'}
        </button>
      </form>
    </div>
  );
}
