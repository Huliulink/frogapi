import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const AuthInput = ({
  type = 'text',
  label,
  value,
  onChange,
  name,
  prefix,
  suffix,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType =
    type === 'password' ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className='auth-input-group'>
      {prefix && <span className='auth-input-prefix'>{prefix}</span>}
      <input
        type={inputType}
        placeholder=' '
        value={value}
        onChange={(e) => onChange(e.target.value)}
        name={name}
        autoComplete='off'
        className={`${prefix ? 'has-prefix' : ''} ${suffix || type === 'password' ? 'has-suffix' : ''}`}
      />
      <label className={prefix ? 'has-prefix' : ''}>{label}</label>
      {type === 'password' && (
        <button
          type='button'
          className='auth-input-eye'
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
      {suffix && <span className='auth-input-suffix'>{suffix}</span>}
    </div>
  );
};

export default AuthInput;
