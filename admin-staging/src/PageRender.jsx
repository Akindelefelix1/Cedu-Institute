import { Navigate, useParams } from "react-router-dom";

import Dashboard from "./pages/dashboard";
import UserManagement from "./pages/user-management";
import ManageUser from "./pages/user-management/manage-user";
import Content from "./pages/content";
import AddQuestion from "./pages/content/add-question";
import EditQuestion from "./pages/content/edit-question";
import UploadFiles from "./pages/content/upload-files";
import Leaderboard from "./pages/leaderboard";
import LeaderboardDetails from "./pages/leaderboard/leaderboard-details";
import CoinSystem from "./pages/coin-system";
import CreateCoin from "./pages/coin-system/create-coin";
import EditCoinPackage from "./pages/coin-system/edit-coin-package";
import EventKeyGuide from "./pages/coin-system/event-key-guide";
import LifeSettings from "./pages/coin-system/life-settings";
import Airtime from "./pages/airtime";
import DailyRewards from "./pages/daily-rewards";
import Categories from "./pages/categories";
import AgeGroups from "./pages/categories/age-groups";
import Learn from "./pages/categories/learn";
import AddAgeGroup from "./pages/categories/add-age-group";
import AddLevel from "./pages/categories/add-level";
import AgeCategories from "./pages/categories/age-categories";
import EditAgeGroup from "./pages/categories/edit-age-group";
import EditCategories from "./pages/categories/edit-categories";
import LevelQuestions from "./pages/categories/level-questions";
import ViewCategories from "./pages/categories/view-categories";
import Notifications from "./pages/notifications";
import NewNotification from "./pages/notifications/new-notification";
import ViewNotification from "./pages/notifications/view-notification";
import Settings from "./pages/settings";
import SettingsSection from "./pages/settings/[id]";
import Admins from "./pages/admins";
import LogOut from "./pages/log-out";
import Resources from "./pages/resources";
import FamilyPageContent from "./pages/family-page";
import Institutions from "./pages/institutions";

// Keeping routed pages in the main bundle prevents stale lazy chunks from
// blanking the Admin shell after deployment or Back/Forward navigation.
const pages = {
  dashboard: Dashboard,
  "user-management": UserManagement,
  "user-management/manage-user": ManageUser,
  content: Content,
  resources: Resources,
  "family-page": FamilyPageContent,
  institutions: Institutions,
  "content/add-question": AddQuestion,
  "content/edit-question": EditQuestion,
  "content/upload-files": UploadFiles,
  leaderboard: Leaderboard,
  "leaderboard/leaderboard-details": LeaderboardDetails,
  "coin-system": CoinSystem,
  "coin-system/create-coin": CreateCoin,
  "coin-system/edit-coin-package": EditCoinPackage,
  "coin-system/event-key-guide": EventKeyGuide,
  "coin-system/life-settings": LifeSettings,
  airtime: Airtime,
  "daily-rewards": DailyRewards,
  categories: Categories,
  "categories/age-groups": AgeGroups,
  "categories/learn": Learn,
  "categories/add-age-group": AddAgeGroup,
  "categories/add-level": AddLevel,
  "categories/age-categories": AgeCategories,
  "categories/edit-age-group": EditAgeGroup,
  "categories/edit-categories": EditCategories,
  "categories/level-questions": LevelQuestions,
  "categories/view-categories": ViewCategories,
  notifications: Notifications,
  "notifications/new-notification": NewNotification,
  "notifications/view-notification": ViewNotification,
  settings: Settings,
  admins: Admins,
  "log-out": LogOut,
};

export default function PageRender() {
  const { page, id } = useParams();

  const routeKey = id ? `${page}/${id}` : page;
  const Component = pages[routeKey] || (page === "settings" && id ? SettingsSection : null);

  if (!Component) return <Navigate to="/dashboard" replace />;
  return <Component />;
}
