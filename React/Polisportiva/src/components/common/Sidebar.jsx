import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  
  const tabs = [
    {
      id: 'prima-nota',
      name: 'Prima Nota',
      path: '/prima-nota'
    },
    {
      id: 'nuovo-socio',
      name: 'Nuovo socio',
      path: '/nuovo-socio'
    },
    {
      id: 'elenco-soci',
      name: 'Elenco Soci',
      path: '/elenco-soci'
    },
    {
      id: 'libro-socio',
      name: 'Libro Socio',
      path: '/libro-socio'
    },
    {
      id: 'parametri',
      name: 'Parametri',
      path: '/parametri'
    },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className="w-64 bg-gray-100 border-r border-gray-200 min-h-screen">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Menu</h2>
        <nav>
          <ul>
            {tabs.map((tab) => (
              <li key={tab.id} className="mb-2">
                <Link
                  to={tab.path}
                  className={`block px-4 py-2 rounded ${
                    isActive(tab.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;