import { AppError } from "../classes/appError";
import { userRoles } from "../constants/global.constant";

interface Project {
  supervisor: string | { toString: () => string };
  manager: string | { toString: () => string };
  company_admin?: string | { toString: () => string };
}

/**
 * Checks if a user is authorized to perform actions on a project based on their association with allowed roles.
 * @param project - The project object containing supervisor, manager, and optional company_admin fields.
 * @param userId - The ID of the user attempting the action.
 * @param allowedRoles - Array of roles allowed to perform the action (e.g., ['companyAdmin', 'supervisor', 'manager']).
 * @throws AppError - Throws 401 Unauthorized if the user is not associated with the project in an allowed role.
 */
const checkProjectAuthorization = (
  project: Project,
  userId: string,
  allowedRoles: string[]
): void => {
  // Convert project fields to strings for comparison
  const supervisorId = project.supervisor.toString();
  const managerId = project.manager.toString();
  const companyAdminId = project.company_admin?.toString();

  // Check if userId matches any allowed role's associated ID
  let isAuthorized = false;

  if (allowedRoles.includes(userRoles.employee)) {
    // Check if userId matches supervisor or manager
    if (userId === supervisorId || userId === managerId) {
      isAuthorized = true;
    }
  }

  if (allowedRoles.includes(userRoles.companyAdmin) && companyAdminId) {
    // Check if userId matches company_admin
    if (userId === companyAdminId) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    throw new AppError(401, "You are not associated with the project or lack permission!");
  }
};

export default checkProjectAuthorization;