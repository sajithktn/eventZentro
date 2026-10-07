"use client";

export const formatCurrency = (value: number) => {
    if (value === 0)
        return "Free";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
};

export const getDay = (date: string | Date) => new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
});

export const getMonth = (date: string | Date) => new Date(date).toLocaleDateString("en-IN", {
    month: "short",
});
