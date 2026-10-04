import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearchClick?: () => void;
}

const Input: React.FC<InputProps> = ({
  placeholder = "Search",
  className = "",
  type = "text",
  onSearchClick,
  ...props
}) => {
  return (
    <div className={`search ${className}`}>
      <input
        placeholder={placeholder}
        className="search__input"
        type={type}
        {...props}
      />
      <button
        type="button"
        className="search__button"
        onClick={onSearchClick}
        aria-label="Search"
      >
        <svg
          viewBox="0 0 16 16"
          className="bi bi-search"
          fill="currentColor"
          height={16}
          width={16}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
        </svg>
      </button>
    </div>
  );
};

export default Input;
