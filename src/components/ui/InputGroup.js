import React from 'react';

const InputGroup = ({
    label,
    value,
    placeholder,
    onChange,
    isMonospace = false,
    readOnly = false,
    type = 'text',
    className = ''
}) => {
    const id = label ? String(label).toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined;

    return (
        <div className={`flex flex-col space-y-2 ${className}`}>
            {label && (
                <label
                    htmlFor={id}
                    className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                    {label}
                </label>
            )}
            <input
                id={id}
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={onChange}
                readOnly={readOnly}
                className={`w-full p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all shadow-sm ${readOnly ? 'bg-gray-50 dark:bg-slate-900 cursor-not-allowed opacity-70' : ''
                    } ${isMonospace ? 'font-mono' : ''}`}
            />
        </div>
    );
};

export default InputGroup;
