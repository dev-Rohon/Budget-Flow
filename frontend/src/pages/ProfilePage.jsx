import React, { useEffect, useRef, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { getCurrencyLabel } from '../utils/currency';
import { getCurrentUser, setCurrentUser } from '../utils/userStorage';
import { getCurrentUserFromAPI, updateCurrentUser } from '../utils/api';

export function ProfilePage() {
  const defaultProfile = {
    name: 'Rohan Sharma',
    email: 'rohan@example.com',
  };

  const [profile, setProfile] = useState(defaultProfile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);

  // Profile picture
  const [profilePicture, setProfilePicture] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [zoom, setZoom] = useState(0.6);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef(null);
  const cropAreaRef = useRef(null);
  const dragStartRef = useRef(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Get locally stored data first
        const localUser = getCurrentUser();

        if (localUser) {
          setProfile((p) => ({ ...p, ...localUser }));
          setDraft((d) => ({ ...d, ...localUser }));

          if (localUser.profilePicture) {
            setProfilePicture(localUser.profilePicture);
          }
        }

        // Backend is the source of truth for account information
        const backendUser = await getCurrentUserFromAPI();

        const updatedUser = {
          ...backendUser,
          profilePicture: localUser?.profilePicture || null,
        };

        setProfile(updatedUser);
        setDraft(updatedUser);

        // Keep local cache synchronized
        setCurrentUser(updatedUser);
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };

    loadProfile();
  }, []);

  /*
   * ---------------------------------------------------------
   * PROFILE EDITING
   * ---------------------------------------------------------
   */

  const startEdit = () => {
    setDraft(profile);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(profile);
    setEditing(false);
  };

  const saveEdit = async () => {
    if (!draft.name || !draft.name.trim()) {
      alert('Name cannot be empty');
      return;
    }

    if (!draft.email || !draft.email.trim()) {
      alert('Email cannot be empty');
      return;
    }

    try {
      const updatedUser = await updateCurrentUser({
        name: draft.name.trim(),
      });

      const toSave = {
        ...updatedUser,
        profilePicture,
      };

      setProfile(toSave);
      setDraft(toSave);
      setEditing(false);

      // Keep local cache synchronized
      setCurrentUser(toSave);

      window.dispatchEvent(
        new Event('budgetflow-profile-updated')
      );
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert(error.message || 'Failed to update profile.');
    }
  };

  /*
   * ---------------------------------------------------------
   * PROFILE PICTURE
   * ---------------------------------------------------------
   */

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    // Limit upload size to 5 MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Please choose an image smaller than 5 MB.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setImagePreview(reader.result);
      setZoom(0.6);
      setPosition({ x: 0, y: 0 });
      setShowCropper(true);
    };

    reader.readAsDataURL(file);

    // Allow selecting the same file again
    event.target.value = '';
  };

  const handleCropMouseDown = (event) => {
    event.preventDefault();

    dragStartRef.current = {
      mouseX: event.clientX,
      mouseY: event.clientY,
      startX: position.x,
      startY: position.y,
    };
  };

  const handleCropMouseMove = (event) => {
    if (!dragStartRef.current) return;

    const deltaX =
      event.clientX - dragStartRef.current.mouseX;

    const deltaY =
      event.clientY - dragStartRef.current.mouseY;

    setPosition({
      x: dragStartRef.current.startX + deltaX,
      y: dragStartRef.current.startY + deltaY,
    });
  };

  const handleCropMouseUp = () => {
    dragStartRef.current = null;
  };

  const handleCropTouchStart = (event) => {
    const touch = event.touches[0];

    dragStartRef.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      startX: position.x,
      startY: position.y,
    };
  };

  const handleCropTouchMove = (event) => {
    if (!dragStartRef.current) return;

    const touch = event.touches[0];

    const deltaX =
      touch.clientX - dragStartRef.current.mouseX;

    const deltaY =
      touch.clientY - dragStartRef.current.mouseY;

    setPosition({
      x: dragStartRef.current.startX + deltaX,
      y: dragStartRef.current.startY + deltaY,
    });
  };

  const handleCropTouchEnd = () => {
    dragStartRef.current = null;
  };

  const saveProfilePicture = () => {
    if (!imagePreview || !cropAreaRef.current) return;

    const cropSize = 320;
    const canvas = document.createElement('canvas');

    canvas.width = cropSize;
    canvas.height = cropSize;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      alert('Unable to process the image.');
      return;
    }

    const image = new Image();

    image.onload = () => {
      const cropElement = cropAreaRef.current;
      const displaySize = cropElement.offsetWidth;

      // Scale from the visible crop area to the 320x320 canvas
      const scale = cropSize / displaySize;

      const drawWidth = image.width * zoom;
      const drawHeight = image.height * zoom;

      const drawX =
        (displaySize - drawWidth) / 2 + position.x;

      const drawY =
        (displaySize - drawHeight) / 2 + position.y;

      ctx.clearRect(0, 0, cropSize, cropSize);

      ctx.drawImage(
        image,
        drawX * scale,
        drawY * scale,
        drawWidth * scale,
        drawHeight * scale
      );

      const finalImage = canvas.toDataURL('image/jpeg', 0.85);

      // Update React immediately
      setProfilePicture(finalImage);

      // Close cropper
      setShowCropper(false);

      // Save to localStorage
      try {
        const currentUser = getCurrentUser() || {};

        const updatedUser = {
          ...currentUser,
          profilePicture: finalImage,
        };

        setCurrentUser(updatedUser);

        // Keep local profile state synchronized
        setProfile((prev) => ({
          ...prev,
          profilePicture: finalImage,
        }));

        // Tell the rest of the app that the profile changed
        window.dispatchEvent(new Event('budgetflow-profile-updated'));
      } catch (error) {
        console.error('Failed to save profile picture:', error);
        alert('Profile picture could not be saved.');
      }
    };

    image.onerror = () => {
      alert('Unable to load the selected image.');
    };

    image.src = imagePreview;
  };

  const removeProfilePicture = () => {
    const confirmed = window.confirm(
      'Are you sure you want to remove your profile picture?'
    );

    if (!confirmed) return;

    setProfilePicture(null);

    try {
      const currentUser = getCurrentUser() || {};

      const updatedUser = {
        ...currentUser,
      };

      delete updatedUser.profilePicture;

      setCurrentUser(updatedUser);

      // Tell the rest of the app that the profile changed
      window.dispatchEvent(new Event('budgetflow-profile-updated'));
    } catch (e) {
      // ignore storage errors
    }
  };

  const getInitials = () => {
    return profile.name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('');
  };

  return (
    <>
      <header>
        <h1 className="font-headline-lg text-headline-lg font-bold text-primary">
          User Profile
        </h1>

        <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">
          Manage your personal details and account settings
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">

        {/* PROFILE CARD */}
        <Card className="flex flex-col items-center text-center p-xl gap-md">

          {/* PROFILE PICTURE */}
          <div className="relative group">

            {profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-surface-container"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-3xl">
                {getInitials()}
              </div>
            )}

            {/* Camera button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md hover:scale-105 transition-transform"
              aria-label="Change profile picture"
            >
              <span className="material-symbols-outlined text-[20px]">
                photo_camera
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Remove picture */}
          {profilePicture && (
            <button
              type="button"
              onClick={removeProfilePicture}
              className="text-xs text-error hover:underline"
            >
              Remove photo
            </button>
          )}

          <div className="w-full">

            {!editing ? (
              <>
                <h2 className="font-headline-md text-headline-md text-primary font-bold">
                  {profile.name}
                </h2>

                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {profile.email}
                </p>

                <div className="mt-sm">
                  <Badge variant="success">
                    Active Pro Plan
                  </Badge>
                </div>

                <div className="mt-sm">
                  <Button
                    variant="outline"
                    className="w-full mt-sm"
                    onClick={startEdit}
                  >
                    EDIT PROFILE
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-md">

                <Input
                  label="FULL NAME"
                  value={draft.name}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      name: e.target.value,
                    })
                  }
                />

                <Input
                  label="EMAIL ADDRESS"
                  type="email"
                  value={draft.email}
                  readOnly
                />

                <div className="flex gap-sm mt-sm">

                  <Button
                    className="flex-1"
                    onClick={saveEdit}
                  >
                    SAVE
                  </Button>

                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={cancelEdit}
                  >
                    CANCEL
                  </Button>

                </div>
              </div>
            )}

          </div>
        </Card>

        {/* ACCOUNT SUMMARY */}
        <Card className="lg:col-span-2 flex flex-col gap-md">

          <h2 className="font-headline-md text-headline-md text-primary">
            Account Summary
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md mt-sm">

            <div className="p-md bg-surface-container rounded-lg">
              <p className="font-label-caps text-label-caps text-on-surface-variant">
                MEMBER SINCE
              </p>

              <p className="font-body-lg text-body-lg font-bold text-primary mt-xs">
                August 2026
              </p>
            </div>

            <div className="p-md bg-surface-container rounded-lg">
              <p className="font-label-caps text-label-caps text-on-surface-variant">
                DEFAULT CURRENCY
              </p>

              <p className="font-body-lg text-body-lg font-bold text-primary mt-xs">
                {getCurrencyLabel()}
              </p>
            </div>

            <div className="p-md bg-surface-container rounded-lg">
              <p className="font-label-caps text-label-caps text-on-surface-variant">
                CONNECTED ACCOUNTS
              </p>

              <p className="font-body-lg text-body-lg font-bold text-primary mt-xs">
                2 Accounts
              </p>
            </div>

            <div className="p-md bg-surface-container rounded-lg">
              <p className="font-label-caps text-label-caps text-on-surface-variant">
                SECURITY STATUS
              </p>

              <p className="font-body-lg text-body-lg font-bold text-on-tertiary-container mt-xs">
                Protected (2FA Enabled)
              </p>
            </div>

          </div>
        </Card>
      </div>

      {/* IMAGE CROPPER MODAL */}
      {showCropper && imagePreview && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">

          <div className="w-full max-w-md bg-surface rounded-2xl shadow-2xl p-lg">

            <div className="flex items-center justify-between mb-md">

              <div>
                <h2 className="font-headline-md text-headline-md font-bold text-primary">
                  Adjust Profile Picture
                </h2>

                <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                  Drag the image and adjust the zoom
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCropper(false)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined">
                  close
                </span>
              </button>

            </div>

            {/* CROP AREA */}
            <div
              ref={cropAreaRef}
              className="relative mx-auto w-[min(80vw,380px)] h-[min(80vw,380px)] overflow-hidden rounded-full bg-surface-container cursor-move select-none touch-none"
              onMouseDown={handleCropMouseDown}
              onMouseMove={handleCropMouseMove}
              onMouseUp={handleCropMouseUp}
              onMouseLeave={handleCropMouseUp}
              onTouchStart={handleCropTouchStart}
              onTouchMove={handleCropTouchMove}
              onTouchEnd={handleCropTouchEnd}
            >

              <img
                src={imagePreview}
                alt="Crop preview"
                draggable="false"
                className="absolute left-1/2 top-1/2 max-w-none pointer-events-none"
                style={{
                  transform: `
                    translate(-50%, -50%)
                    translate(${position.x}px, ${position.y}px)
                    scale(${zoom})
                  `,
                }}
              />

            </div>

            {/* ZOOM */}
            <div className="mt-lg">

              <div className="flex items-center gap-sm">

                <span className="material-symbols-outlined text-on-surface-variant">
                  remove
                </span>

                <input
                  type="range"
                  min="0.4"
                  max="2.5"
                  step="0.05"
                  value={zoom}
                  onChange={(e) =>
                    setZoom(Number(e.target.value))
                  }
                  className="flex-1 accent-primary"
                />

                <span className="material-symbols-outlined text-on-surface-variant">
                  add
                </span>

              </div>

              <p className="text-center text-xs text-on-surface-variant mt-xs">
                Zoom: {Math.round(zoom * 100)}%
              </p>

            </div>

            {/* ACTIONS */}
            <div className="flex gap-sm mt-lg">

              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowCropper(false)}
              >
                CANCEL
              </Button>

              <Button
                className="flex-1"
                onClick={saveProfilePicture}
              >
                SAVE PHOTO
              </Button>

            </div>

          </div>
        </div>
      )}
    </>
  );
}