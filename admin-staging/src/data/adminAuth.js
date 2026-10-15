export const ADMINS_KEY = "CEDUGAMES_ADMINS";
export const SESSION_USER_KEY = "CEDUGAMES_ADMIN_USER";

export const PERMISSIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "user-management", label: "User Management" },
  { key: "content", label: "Content" },
  { key: "leaderboard", label: "Leaderboard" },
  { key: "coin-system", label: "Coin System" },
  { key: "airtime", label: "Airtime Redemptions" },
  { key: "daily-rewards", label: "Daily Rewards" },
  { key: "categories", label: "Categories / Levels" },
  { key: "notifications", label: "Notifications" },
  { key: "settings", label: "Settings" },
  { key: "admins", label: "Admin Management" },
  { key: "institutions", label: "Institutions" },
];

const SUPER_ADMIN = {
  id: "super-admin",
  name: "Super Admin",
  email: "cedugames@gmail.com",
  password: "Admin@1234",
  role: "Super Admin",
  permissions: ["*"],
  status: "Active",
};

export const getAdmins = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(ADMINS_KEY) || "[]");
    return [SUPER_ADMIN, ...saved.filter((admin) => admin.id !== SUPER_ADMIN.id)];
  } catch {
    return [SUPER_ADMIN];
  }
};

export const saveAdmins = (admins) => {
  const regularAdmins = admins.filter((admin) => admin.id !== SUPER_ADMIN.id);
  localStorage.setItem(ADMINS_KEY, JSON.stringify(regularAdmins));
};

export const authenticateAdmin = (email, password) =>
  getAdmins().find(
    (admin) =>
      admin.email.toLowerCase() === email.trim().toLowerCase() &&
      admin.password === password &&
      admin.status === "Active"
  );

export const publicAdmin = ({ password, ...admin }) => admin;

export const canAccess = (user, page) => {
  if (!user) return false;
  if (user.role === "Super Admin" || user.permissions?.includes("*")) return true;
  if (page === "log-out") return true;
  const permission = ["resources", "family-page"].includes(page) ? "content" : page;
  return user.permissions?.includes(permission) || false;
};

export const getDefaultRoute = (user) => {
  if (canAccess(user, "dashboard")) return "/dashboard";
  const firstPermission = user?.permissions?.find((permission) => permission !== "*");
  return firstPermission ? `/${firstPermission}` : "/";
};

export const getSessionUser = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_USER_KEY) || "null");
  } catch {
    return null;
  }
};
