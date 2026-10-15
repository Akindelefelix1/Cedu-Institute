import React, { useEffect, useState } from "react";
import { FaChevronDown, FaCog, FaGift, FaLayerGroup, FaSignOutAlt, FaBars, FaMobileAlt, FaUsers, FaImages } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CEDUGAMES from "../../assets/cedugames-logo.png";
import {
  FaUserGraduate,
  FaBook,
  FaChartLine,
  FaSchool,
  FaTrophy,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { canAccess } from "../../data/adminAuth";

const Sidebar = ({ children, onSelectPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const groups = [
    { id: "players", label: "Players & Rankings", icon: <FaUsers />, children: [
      { to: "/user-management", label: "User Management", icon: <FaUserGraduate /> },
      { to: "/leaderboard", label: "Leaderboard", icon: <FaChartLine /> },
    ] },
    { id: "learning", label: "Learning Management", icon: <FaLayerGroup />, children: [
      { to: "/content", label: "Content", icon: <FaBook /> },
      { to: "/resources", label: "Resources", icon: <FaImages />, page: "content" },
      { to: "/categories", label: "Categories & Levels", icon: <FaTrophy /> },
    ] },
    { id: "rewards", label: "Rewards & Wallet", icon: <FaGift />, children: [
      { to: "/coin-system", label: "Coin System", icon: <FaSchool /> },
      { to: "/daily-rewards", label: "Daily Rewards", icon: <FaGift /> },
      { to: "/airtime", label: "Airtime", icon: <FaMobileAlt /> },
    ] },
    { id: "administration", label: "Administration", icon: <FaCog />, children: [
      { to: "/institutions", label: "Institutions", icon: <FaSchool /> },
      { to: "/family-page", label: "Family Page", icon: <FaImages />, page: "content" },
      { to: "/settings", label: "Settings", icon: <FaCog /> },
      { to: "/admins", label: "Admins", icon: <FaUsers />, page: "admins" },
    ] },
  ].map((group) => ({ ...group, children: group.children.filter(({ to, page }) => canAccess(user, page || to.split("/")[1])) })).filter((group) => group.children.length);
  const standaloneLinks = [
    { to: "/dashboard", label: "Dashboard", icon: <FaUserGraduate /> },
    { to: "/notifications", label: "Notifications", icon: <FaChartLine /> },
  ].filter(({ to }) => canAccess(user, to.split("/")[1]));
  const activeGroup = groups.find((group) => group.children.some(({ to }) => location.pathname === to || location.pathname.startsWith(`${to}/`)))?.id;
  const [openGroup, setOpenGroup] = useState(() => activeGroup || null);

  useEffect(() => {
    if (activeGroup) setOpenGroup(activeGroup);
  }, [activeGroup]);

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(`${to}/`);
  const toggleGroup = (id) => setOpenGroup((current) => current === id ? null : id);

  return (
    <div className=" font-Outfit">
      <button
        className="fixed left-3 top-4 z-20 rounded-lg bg-white p-2 text-md text-[#202020] shadow md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaBars />
      </button>
      <div className="nav">
        <div
          className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[86vw] overflow-y-auto overscroll-contain bg-gradient-to-br from-[#9B5DE5] to-[#56347F] p-4 shadow-lg transition-transform duration-300 md:w-56 md:translate-x-0 md:p-5 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            className="md:hidden relative right-20 block  text-2xl text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            X
          </button>
          <div>
            <Link to="/dashboard">
              <div className="mt-10 md:mt-20">
                <img
                  className=" w-48"
                  src={CEDUGAMES}
                  alt="Logo"
                />
              </div>
            </Link>
          </div>

          <nav className="font-Outfit mt-10 md:mt-20 pb-6">
            {standaloneLinks.slice(0, 1).map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                onClick={(event) => {
                  setIsOpen(false);
                }}
                className={`relative mb-3 block rounded px-2 py-2.5 text-sm hover:bg-[#F8F8F8] ${
                  isActive(to)
                    ? "bg-purple-200 text-purple-600  active-link"
                    : "text-white hover:text-[#6a0dad]"
                }`}
              >
                <span className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600 rounded-tr-lg rounded-br-lg transform scale-0 transition-transform duration-300 origin-left">
                  {isActive(to) && (
                    <span className="block h-full w-1 bg-purple-600 rounded-tr-lg rounded-br-lg"></span>
                  )}
                </span>
                <span className="inline-flex items-center">
                  {icon}
                  <span className="ml-3">{label}</span>
                </span>
              </Link>
            ))}
            {groups.map((group) => {
              const expanded = openGroup === group.id;
              const groupActive = group.id === activeGroup;
              return <div key={group.id} className="mb-2">
                <button type="button" onClick={() => toggleGroup(group.id)} aria-expanded={expanded} className={`flex w-full items-center rounded px-2 py-2.5 text-left text-sm transition ${groupActive ? "bg-white/15 text-white" : "text-white hover:bg-white/10"}`}>
                  <span className="inline-flex w-5 justify-center">{group.icon}</span><span className="ml-3 flex-1 font-semibold">{group.label}</span><FaChevronDown className={`text-xs transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>
                {expanded && <div className="ml-3 mt-1 border-l border-white/25 pl-3">{group.children.map(({ to, label, icon }) => <Link key={to} to={to} onClick={() => setIsOpen(false)} className={`relative mb-1 flex items-center rounded px-2 py-2.5 text-sm transition ${isActive(to) ? "bg-purple-200 font-semibold text-purple-700" : "text-purple-50 hover:bg-white hover:text-purple-700"}`}><span className="inline-flex w-5 justify-center text-xs">{icon}</span><span className="ml-2">{label}</span></Link>)}</div>}
              </div>;
            })}
            {standaloneLinks.slice(1).map(({ to, label, icon }) => <Link key={to} to={to} onClick={() => setIsOpen(false)} className={`relative mb-3 mt-2 block rounded px-2 py-2.5 text-sm hover:bg-[#F8F8F8] ${isActive(to) ? "bg-purple-200 text-purple-600" : "text-white hover:text-[#6a0dad]"}`}><span className="inline-flex items-center">{icon}<span className="ml-3">{label}</span></span></Link>)}
            <button type="button" onClick={() => setConfirmLogout(true)} className="mb-2 flex w-full items-center rounded px-2 py-2.5 text-left text-sm text-white hover:bg-white hover:text-[#6a0dad]"><FaSignOutAlt /><span className="ml-3">Log Out</span></button>
          </nav>
        </div>
        {isOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-slate-950/40 md:hidden" onClick={() => setIsOpen(false)} />}
        <main className="min-h-screen min-w-0 overflow-x-hidden bg-[#fafbfc] md:ml-56">{children}</main>
      </div>
      {confirmLogout && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={() => setConfirmLogout(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="admin-logout-title" className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-2xl text-red-500"><FaSignOutAlt /></div>
            <h2 id="admin-logout-title" className="mt-5 text-2xl font-bold text-slate-900">Log out of admin?</h2>
            <p className="mt-2 text-sm text-slate-500">You will need to sign in again to manage Cedu.</p>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <button onClick={() => setConfirmLogout(false)} className="rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700">Stay signed in</button>
              <button onClick={() => navigate("/log-out")} className="rounded-xl bg-red-500 px-4 py-3 font-semibold text-white">Log out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
