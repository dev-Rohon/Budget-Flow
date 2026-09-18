import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../../utils/userStorage';

export function Header({ title = 'BudgetFlow' }) {
  const [profilePicture, setProfilePicture] = useState(null);

  useEffect(() => {
    const loadProfilePicture = () => {
      const user = getCurrentUser();
      setProfilePicture(user?.profilePicture || null);
    };

    loadProfilePicture();

    // Update immediately when profile picture is changed
    window.addEventListener('budgetflow-profile-updated', loadProfilePicture);

    return () => {
      window.removeEventListener(
        'budgetflow-profile-updated',
        loadProfilePicture
      );
    };
  }, []);

  return (
    <header className="md:hidden w-full h-16 border-b border-outline-variant bg-surface flex justify-between items-center px-margin-mobile fixed top-0 z-40">

      {/* BudgetFlow Logo */}
      <Link
        to="/dashboard"
        className="flex items-center gap-sm text-primary"
      >
        <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-on-primary">
          <span className="material-symbols-outlined text-[20px]">
            account_balance
          </span>
        </div>

        <span className="font-headline-lg-mobile text-headline-lg-mobile font-black">
          {title}
        </span>
      </Link>

      {/* Profile Picture */}
      <Link
        to="/profile"
        className="cursor-pointer active:opacity-80 flex items-center justify-center"
      >
        {profilePicture ? (
          <img
            src={profilePicture}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover border-2 border-primary-container"
          />
        ) : (
          <span className="material-symbols-outlined text-[30px] text-primary">
            account_circle
          </span>
        )}
      </Link>

    </header>
  );
}