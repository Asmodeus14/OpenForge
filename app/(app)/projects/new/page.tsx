import type { Metadata } from 'next';
import { CreateProjectForm } from './CreateProjectForm';

export const metadata: Metadata = {
  title: 'New project',
  description: 'Register a project on the OpenForge project registry.',
};

export default function NewProjectPage() {
  return <CreateProjectForm />;
}
