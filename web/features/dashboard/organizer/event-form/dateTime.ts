"use client";

export const toDateInputValue = (date?: string) => {
    if (!date) {
        return "";
    }
    const currentDate = new Date(date);
    if (Number.isNaN(currentDate.getTime())) {
        return "";
    }
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export const formatDateValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export const parseDateValue = (value: string) => {
    if (!value) {
        return null;
    }
    return new Date(`${value}T00:00:00`);
};

export const formatTimeValue = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
};

export const parseTimeValue = (value: string) => {
    if (!value) {
        return null;
    }
    const [hours, minutes] = value
        .split(":")
        .map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
};
