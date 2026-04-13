import React, { useState, useRef, useEffect } from 'react';
import { maharashtraDistricts, filterDistricts } from '../utils/districts';

const DistrictSelect = ({ value, onChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDistricts, setFilteredDistricts] = useState(maharashtraDistricts);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setFilteredDistricts(filterDistricts(searchTerm));
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleSelectDistrict = (district) => {
    onChange({ target: { name: 'district', value: district } });
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search or select district..."
        value={searchTerm || value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        disabled={disabled}
        className="input-field"
      />
      
      {isOpen && filteredDistricts.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg dark:shadow-2xl max-h-64 overflow-y-auto z-10">
          {filteredDistricts.map((district) => (
            <button
              key={district}
              type="button"
              onClick={() => handleSelectDistrict(district)}
              className={`w-full text-left px-4 py-3 hover:bg-green-100 dark:hover:bg-green-900/50 transition ${
                value === district ? 'bg-green-200 dark:bg-green-800 font-semibold' : 'text-gray-700 dark:text-gray-200'
              }`}
            >
              {district}
            </button>
          ))}
        </div>
      )}

      {isOpen && filteredDistricts.length === 0 && searchTerm && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg dark:shadow-2xl px-4 py-3 text-gray-500 dark:text-gray-400 z-10">
          No districts found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default DistrictSelect;
