import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import CourseViewer from '@/components/course/CourseViewer';
import { DashboardLayout } from '@/components/admin/DashboardLayout';

export default function CoursePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = router.query;

  if (!id || typeof id !== 'string') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Curso não encontrado</h1>
            <p className="text-gray-600">O ID do curso não foi fornecido ou é inválido.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <div className="h-screen">
      <CourseViewer 
        courseId={id}
        userId={user?.id}
        isAdmin={user?.user_metadata?.role === 'admin'}
      />
    </div>
  );
}