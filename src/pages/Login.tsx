import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Printer } from 'lucide-react';
import { motion } from 'motion/react';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(username, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-brand-cyan rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-magenta rounded-full blur-3xl"></div>
      </div>
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="neo-card max-w-md w-full mx-4 z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black text-brand-yellow rounded-lg mb-4">
            <Printer className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-space font-bold mb-2">Evermagic Graphic</h1>
          <p className="text-gray-600">Billing & Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-500 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="neo-input w-full px-4"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="neo-input w-full px-4"
              required
            />
          </div>


          <button
            type="submit"
            className="neo-button w-full py-3 text-lg"
          >
            Login
          </button>
        </form>
      </motion.div>
    </div>
  );
};
