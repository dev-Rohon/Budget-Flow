import React from 'react';
import { NavLink } from 'react-router-dom';

const mobileNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'grid_view' },
  { path: '/transactions', label: 'Transactions', icon: 'swap_horiz' },
  { path: '/analytics', label: 'Analytics', icon: 'analytics' },
  { path: '/budgets', label: 'Budgets', icon: 'pie_chart' },
];

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex items-center gap-1 px-2 py-2 bg-surface border-t border-outline-variant shadow-lg rounded-t-xl">
      {mobileNavItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex-1 min-w-0 flex flex-col items-center justify-center px-1 py-2 rounded-lg transition-transform active:scale-90 ${isActive
              ? 'text-primary font-bold bg-surface-container-high'
              : 'text-on-surface-variant'
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
              <span className="text-[11px] leading-tight mt-1 whitespace-nowrap">
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
