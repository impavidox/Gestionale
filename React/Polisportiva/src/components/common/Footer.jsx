import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';

const Footer = () => {
  const { conf } = useContext(AppContext);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white py-4 px-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <p className="text-sm">
              &copy; {currentYear} {conf?.clubName || 'Club Manager'}
            </p>
          </div>
          <div className="mt-2 md:mt-0">
            <p className="text-xs text-gray-400">
              {conf?.appVersion ? `Versione ${conf.appVersion}` : ''}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;