import React from "react";

export default function LoginForm() {
  return (
    <form className="flex flex-col gap-4 p-4 border rounded-md max-w-sm">
      <h2 className="text-xl font-medium">Login</h2>
      <input
        type="email"
        name="email"
        placeholder="Email"
        className="border p-2 rounded"
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        className="border p-2 rounded"
      />
      <button type="submit" className="bg-black text-white px-4 py-2 rounded">
        Sign in
      </button>
    </form>
  );
} 