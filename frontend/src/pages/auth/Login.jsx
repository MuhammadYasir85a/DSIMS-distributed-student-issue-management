function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white shadow-md rounded-xl p-8 w-96">
        <h2 className="text-2xl font-semibold text-slate-800 mb-6 text-center">
          Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <button className="w-full bg-emerald-500 text-white py-2 rounded-md hover:bg-emerald-600 transition">
          Sign In
        </button>
      </div>
    </div>
  );
}

export default Login;