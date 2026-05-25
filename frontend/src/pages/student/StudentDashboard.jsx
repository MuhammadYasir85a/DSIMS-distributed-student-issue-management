function StudentDashboard() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-800 mb-4">
        Student Dashboard
      </h2>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white shadow-md p-6 rounded-xl">
          <p className="text-sm text-slate-500">Total Issues</p>
          <h3 className="text-2xl font-bold text-slate-800">0</h3>
        </div>

        <div className="bg-white shadow-md p-6 rounded-xl">
          <p className="text-sm text-slate-500">Open Issues</p>
          <h3 className="text-2xl font-bold text-amber-500">0</h3>
        </div>

        <div className="bg-white shadow-md p-6 rounded-xl">
          <p className="text-sm text-slate-500">Resolved Issues</p>
          <h3 className="text-2xl font-bold text-emerald-500">0</h3>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;