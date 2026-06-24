'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth, type UserProject } from '@/store/auth';

export interface Project {
  id: string;
  procoreId: string | null;
  name: string;
  code: string;
  stage?: string;
  stageEs?: string;
  type?: string;
  pm?: string;
  openRFIs: number;
  overdueRFIs: number;
  inYourCourt: number;
  next7Days: number;
  openSubmittals: number;
  pendingReview: number;
  gaps: number;
  brokenCommitments: number;
  lastSync: string;
  status: string;
}

// Demo fallback (used when not authenticated or no projects synced)
const DEMO_PROJECTS: Project[] = [
  {
    id: 'demo-1',
    procoreId: '6008',
    name: 'The Edge at Sunset',
    code: '06008',
    stage: 'Pre-Construction',
    stageEs: 'Pre-Construcción',
    type: 'Mixed Use Apartments',
    pm: 'Oscar Hernandez (JAXI)',
    openRFIs: 18,
    overdueRFIs: 17,
    inYourCourt: 5,
    next7Days: 1,
    openSubmittals: 12,
    pendingReview: 8,
    gaps: 4,
    brokenCommitments: 3,
    lastSync: '5 min ago',
    status: 'ACTIVE',
  },
  {
    id: 'demo-2',
    procoreId: '6012',
    name: 'Coral Gables Tower A',
    code: '06012',
    stage: 'Construction',
    stageEs: 'Construcción',
    type: 'Residential High-Rise',
    pm: 'Eduardo Martinez (JAXI)',
    openRFIs: 31,
    overdueRFIs: 6,
    inYourCourt: 9,
    next7Days: 4,
    openSubmittals: 14,
    pendingReview: 5,
    gaps: 2,
    brokenCommitments: 1,
    lastSync: '12 min ago',
    status: 'ACTIVE',
  },
  {
    id: 'demo-3',
    procoreId: '6015',
    name: 'Miami Beach Renovation Ph. 2',
    code: '06015',
    stage: 'Design',
    stageEs: 'Diseño',
    type: 'Commercial Renovation',
    pm: 'Ana Perez (JAXI)',
    openRFIs: 8,
    overdueRFIs: 2,
    inYourCourt: 2,
    next7Days: 3,
    openSubmittals: 5,
    pendingReview: 3,
    gaps: 1,
    brokenCommitments: 0,
    lastSync: '1 hour ago',
    status: 'ACTIVE',
  },
];

function mapUserProject(up: UserProject): Project {
  return {
    id:               up.id,
    procoreId:        up.procoreId,
    name:             up.name,
    code:             up.code,
    stage:            'Active',
    stageEs:          'Activo',
    type:             up.description ?? '',
    pm:               '',
    openRFIs:         up._count.rfis,
    overdueRFIs:      0, // populated after RFI sync
    inYourCourt:      0,
    next7Days:        0,
    openSubmittals:   up._count.submittals,
    pendingReview:    0,
    gaps:             0,
    brokenCommitments:0,
    lastSync:         'just now',
    status:           up.status,
  };
}

interface ProjectContextType {
  selectedProject: Project | null;
  setSelectedProject: (p: Project | null) => void;
  projects: Project[];
  isDemo: boolean;
}

const ProjectContext = createContext<ProjectContextType>({
  selectedProject: DEMO_PROJECTS[0],
  setSelectedProject: () => {},
  projects: DEMO_PROJECTS,
  isDemo: true,
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, projects: authProjects } = useAuth();

  const realProjects = authProjects.length > 0
    ? authProjects.map(mapUserProject)
    : DEMO_PROJECTS;

  const [selectedProject, setSelectedProject] = useState<Project | null>(realProjects[0] ?? null);

  // When auth projects load, update selected project
  useEffect(() => {
    if (authProjects.length > 0) {
      setSelectedProject(mapUserProject(authProjects[0]));
    }
  }, [authProjects]);

  return (
    <ProjectContext.Provider
      value={{
        selectedProject,
        setSelectedProject,
        projects: realProjects,
        isDemo: !isAuthenticated || authProjects.length === 0,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
