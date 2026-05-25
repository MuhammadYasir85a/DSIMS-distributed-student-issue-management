import { Outlet } from "react-router-dom";

function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-100">
      
      {/* Top Navigation */}
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-lg font-semibold">DSIMS</h1>
        <div className="text-sm opacity-80">
          Campus | Role | Logout
        </div>
      </header>

      <div className="flex">
        
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md p-4 space-y-4">
          <button className="block w-full text-left hover:text-emerald-600">
            Dashboard
          </button>
          <button className="block w-full text-left hover:text-emerald-600">
            Issues
          </button>
          <button className="block w-full text-left hover:text-emerald-600">
            Reports
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>

      </div>
    </div>
  );
}

export default MainLayout;