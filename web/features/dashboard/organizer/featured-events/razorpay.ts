"use client";

export interface RazorpayPaymentResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: RazorpayPaymentResponse) => Promise<void>;
    prefill?: {
        name?: string;
        email?: string;
    };
    notes?: {
        requestId: string;
        eventId?: string;
    };
    theme?: {
        color: string;
    };
    modal?: {
        ondismiss: () => void;
    };
}

export interface RazorpayInstance {
    open: () => void;
    on: (event: string, callback: (response: unknown) => void) => void;
}

export type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

export const loadRazorpayScript = (): Promise<boolean> => new Promise((resolve) => {
    const razorpay = (window as Window & {
        Razorpay?: RazorpayConstructor;
    }).Razorpay;
    if (razorpay) {
        resolve(true);
        return;
    }
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
        existingScript.addEventListener("load", () => resolve(true));
        existingScript.addEventListener("error", () => resolve(false));
        return;
    }
    const script = document.createElement("script");
    script.src =
        "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
});
