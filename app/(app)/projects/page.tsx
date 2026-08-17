import type { Metadata } from 'next';
import { MyProjectsClient } from './MyProjectsClient';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Projects registered to your wallet.',
};

export default function ProjectsPage() {
  return <MyProjectsClient />;
}
