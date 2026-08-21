import React from 'react';

const formatMoney = (value) => {
  const num = String(value).replace(/\D/g, '');
  if (!num) return '';
  return Number(num).toLocaleString('vi-VN');
};

const parseMoney = (formatted) => {
  return String(formatted).replace(/\./g, '').replace(/\D/g, '');
};

const MoneyInput = ({ value, onChange, name, placeholder, className, label, ...rest }) => {
  const handleChange = (e) => {
    const raw = parseMoney(e.target.value);
    onChange({ target: { name, value: raw } });
  };

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          name={name}
          value={formatMoney(value)}
          onChange={handleChange}
          placeholder={placeholder || 'VD: 4.800.000'}
          className={className || 'input-field'}
          {...rest}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">đ</span>
      </div>
    </div>
  );
};

export { formatMoney, parseMoney };
export default MoneyInput;