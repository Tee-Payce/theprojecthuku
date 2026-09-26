let activeProjectId = null;

export const setActiveProjectId = (projectId) => {
  activeProjectId = projectId || null;
};

export const getActiveProjectId = () => {
  if (!activeProjectId) {
    throw new Error('No active project selected');
  }
  return activeProjectId;
};

export const getOptionalActiveProjectId = () => activeProjectId;