import React from 'react';

const Button = ({
    children,
    onClick,
    variant = 'primary',
    disabled = false,
    className = '',
    title,
    type = 'button'
}) => {
    const baseStyles = "px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20 focus:ring-orange-500",
        secondary: "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 dark:hover:border-orange-500 shadow-sm",
        danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300 focus:ring-red-500",
        dangerSolid: "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 focus:ring-red-500",
        success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 focus:ring-emerald-500",
        ghost: "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
};

export default Button;
