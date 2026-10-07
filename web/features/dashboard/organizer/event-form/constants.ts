"use client";

export const inputClassName = "w-full rounded-lg border-2 border-slate-400 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

export const labelClassName = "mb-1.5 block text-sm font-bold text-slate-700";

export const errorClassName = "mt-1 text-xs font-medium text-red-500";

export const allowedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

export const maxImageSizeInBytes = 5 * 1024 * 1024;
