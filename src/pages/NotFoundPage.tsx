import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-8 shadow-sm text-center space-y-5">
        <div className="w-12 h-12 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-600 dark:text-slate-400">
          <Compass className="w-6 h-6" />
        </div>
        
        <div className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-500">
            HTTP 404
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Route Not Found
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            The requested resource or operations URL does not exist on this control plane instance. Check the route path or return to the main dashboard.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded hover:bg-slate-800 dark:hover:bg-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
