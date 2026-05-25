function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white shadow-md rounded-xl p-8 w-96">
        <h2 className="text-2xl font-semibold text-slate-800 mb-6 text-center">
          Register
        </h2>

        <input
          type="text"
          placeholder="Student ID"
          className="w-full mb-3 p-2 border rounded-md"
        />

        <input
          type="text"
          placeholder="Full Name"
          className="w-full mb-3 p-2 border rounded-md"
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-2 border rounded-md"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-2 border rounded-md"
        />

        <button className="w-full bg-slate-900 text-white py-2 rounded-md hover:bg-slate-800 transition">
          Register
        </button>
      </div>
    </div>
  );
}

export default Register;