import { Link, useLocation } from "@tanstack/react-router";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  const location = useLocation();

  // Hide header on /app/* routes and /portal/* routes - they have their own layouts
  if (
    location.pathname.startsWith("/app") ||
    location.pathname.startsWith("/portal")
  ) {
    return null;
  }

  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
  ] as const;

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <nav className="flex gap-4 text-lg">
          {links.map(({ to, label }) => (
            <Link key={to} to={to}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
      <hr />
    </div>
  );
}
