import React from 'react';

const SearchBar = ({ value, onChange, placeholder = 'Tìm kiếm...' }) => {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-10 w-full"
      />
    </div>
  );
};

export default SearchBar;