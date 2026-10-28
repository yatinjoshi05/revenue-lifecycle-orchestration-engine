import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPolicyPage: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 text-slate-800 dark:text-slate-200">
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
      </div>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300">
          <Shield className="w-3.5 h-3.5 text-slate-500" />
          <span>Operational Legal Notice</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-500">
          Effective Date: January 1, {currentYear} | Last verified: Active Platform Build
        </p>
      </div>

      {/* Review Notice */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
        <strong>Notice to Operating Organization:</strong> This document outlines the technical data practices implemented in the NEXUS GTM control plane. It represents a conservative engineering statement of data flow and storage. Formal legal review by qualified counsel is recommended prior to commercial deployment.
      </div>

      <div className="space-y-6 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            1. Scope and Technical Architecture
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            NEXUS GTM operates as a revenue operations and event telemetry control plane. This policy describes how our software processes telemetry data, account identifiers, event records, and system operation logs when deployed on your infrastructure or hosted environments.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            2. Data Types Collected and Processed
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            The platform processes the following technical records submitted via authenticated APIs or connected webhooks:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
            <li>Account domain identifiers (for example: company domains submitted for enrichment).</li>
            <li>Event telemetry payloads (event names, timestamps, correlation identifiers, and metadata properties).</li>
            <li>Operational handoff records (assigned sales roles, SLA status, response timestamps).</li>
            <li>System integrity logs and audit logs capturing administrative actions.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            3. Storage and Persistence
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Production data is persisted in PostgreSQL database tables managed via Supabase Cloud infrastructure. Access to low-level database functions is governed by PostgreSQL role privileges, with untrusted public execution revoked.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            4. Third-Party Integrations
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            The platform provides connector architectures for external tools including Clay, RSS feeds, and automation webhooks. Data is transmitted to external endpoints only when explicitly configured by an authorized administrator.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            5. Contact and Administrative Information
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            For technical queries regarding telemetry handling, contact your designated system administrator or submit inquiries to the designated engineering contact.
          </p>
        </section>
      </div>

      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
        &copy; {currentYear} NEXUS GTM. All rights reserved.
      </div>
    </div>
  );
};
