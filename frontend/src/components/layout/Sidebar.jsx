import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { signOutUser } from '../../utils/userStorage';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/transactions', label: 'Transactions', icon: 'receipt_long' },
  { path: '/budgets', label: 'Budgets', icon: 'account_balance_wallet' },
  { path: '/analytics', label: 'Analytics', icon: 'analytics' },
  { path: '/profile', label: 'Profile', icon: 'person' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

export function Sidebar({ collapsed, setCollapsed }) {
  const navigate = useNavigate();
  // const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = (e) => {
    e.preventDefault();
    signOutUser();
    navigate('/login', { replace: true });
  };

  return (
    <nav
      className={`hidden md:flex flex-col py-lg h-full bg-surface-container-low border-r border-outline-variant shadow-sm fixed left-0 top-0 z-40 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'
        }`}
    >

      {/* Brand Header */}
      <div
        className={`mb-xl ${collapsed
            ? 'flex flex-col items-center gap-lg'
            : 'flex items-center px-lg'
          }`}
      >
        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors shrink-0 ${collapsed ? 'order-2' : 'order-1'
            }`}
        >
          <span className="material-symbols-outlined">
            menu
          </span>
        </button>

        {/* Logo */}
        <div
          className={`${collapsed
              ? 'w-8 h-8 text-[16px] order-1'
              : 'w-10 h-10 text-[18px] order-2'
            } rounded-lg bg-primary-container flex items-center justify-center text-on-primary font-bold shrink-0`}
        >
          <span className="material-symbols-outlined">
            account_balance
          </span>
        </div>

        {/* Brand Name */}
        {!collapsed && (
          <div className="flex-1 ml-md order-3">
            <h1 className="font-headline-md text-headline-md font-bold text-primary">
              BudgetFlow
            </h1>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Personal Finance
            </p>
          </div>
        )}
      </div>



      {/* Navigation Links */}
      <div className="flex flex-col gap-xs flex-1 overflow-hidden">
        {!collapsed &&
          navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-md py-md px-lg transition-all duration-200 active:scale-95 ${isActive
                  ? 'text-primary font-bold bg-surface-container-high'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="material-symbols-outlined"
                    data-weight={isActive ? 'fill' : undefined}
                  >
                    {item.icon}
                  </span>

                  <span className="font-body-sm text-body-sm">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
      </div>

      {/* Sign Out */}
      <div className="mt-auto px-xs">
        <a
          href="#signout"
          onClick={handleSignOut}
          className={`text-on-surface-variant flex items-center py-md hover:bg-surface-container-high transition-all active:scale-95 duration-200 ${collapsed ? 'justify-center' : 'gap-md px-lg'
            }`}
        >
          <span className="material-symbols-outlined">logout</span>

          {!collapsed && (
            <span className="font-body-sm text-body-sm">
              Sign Out
            </span>
          )}
        </a>
      </div>
    </nav >
  );
}