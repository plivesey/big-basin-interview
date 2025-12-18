import { memo } from 'react';
import { useMenuStore, selectIsMenuOpen } from '../store/menu-store';

/**
 * Hamburger menu button that toggles the side menu.
 * Animates between hamburger icon and X icon when menu is open.
 */
export const HamburgerButton = memo(function HamburgerButton() {
  const isMenuOpen = useMenuStore(selectIsMenuOpen);
  const toggleMenu = useMenuStore((state) => state.toggleMenu);

  return (
    <button
      onClick={toggleMenu}
      className="p-2 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
      aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isMenuOpen}
    >
      <div className="w-5 h-5 relative flex flex-col justify-center items-center">
        {/* Top bar */}
        <span
          className={`block absolute h-0.5 w-5 bg-slate-600 transform transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'rotate-45' : '-translate-y-1.5'
          }`}
        />
        {/* Middle bar */}
        <span
          className={`block absolute h-0.5 w-5 bg-slate-600 transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'opacity-0' : 'opacity-100'
          }`}
        />
        {/* Bottom bar */}
        <span
          className={`block absolute h-0.5 w-5 bg-slate-600 transform transition-all duration-300 ease-in-out ${
            isMenuOpen ? '-rotate-45' : 'translate-y-1.5'
          }`}
        />
      </div>
    </button>
  );
});
