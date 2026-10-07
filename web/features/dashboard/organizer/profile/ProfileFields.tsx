"use client";

import { Building2 } from "lucide-react";

export interface EditFieldProps {
    label: string;
    value: string;
    placeholder?: string;
    required?: boolean;
    onChange: (value: string) => void;
}

export function EditField({ label, value, placeholder, required, onChange, }: EditFieldProps) {
    return (<label className="block">
      <span className="text-sm font-bold text-slate-700">
        {label}

        {required && (<span className="ml-1 text-red-500">
            *
          </span>)}
      </span>

      <input type="text" value={value} required={required} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-2 h-12 w-full rounded-xl border-2 border-slate-200 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"/>
    </label>);
}

export interface ProfileDetailProps {
    icon: typeof Building2;
    label: string;
    value: string;
}

export function ProfileDetail({ icon: Icon, label, value, }: ProfileDetailProps) {
    return (<div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
        <Icon size={18}/>
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-bold text-slate-900">
          {value}
        </p>
      </div>
    </div>);
}
