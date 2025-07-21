import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full w-full text-center p-8">
    <h1 className="text-4xl font-bold text-white mb-4">404 – Page Not Found</h1>
    <p className="text-lg text-gray-300 mb-8">Sorry, the page you are looking for does not exist.</p>
    <Link
      to="/"
      className="inline-block px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-colors text-lg font-semibold"
    >
      Go to Homepage
    </Link>
  </div>
);

export default NotFound; 