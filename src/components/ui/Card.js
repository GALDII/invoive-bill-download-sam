import React from 'react';

const Card = ({ children, title, icon, className = '', headerAction }) => {
    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden ${className}`}>
            {(title || icon) && (
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-100">
                        {icon && <span className="text-xl">{icon}</span>}
                        <h3>{title}</h3>
                    </div>
                    {headerAction && <div>{headerAction}</div>}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
        </div>
    );
};

export default Card;
