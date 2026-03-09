import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
    const baseStyles = 'px-4 py-2 rounded-full font-medium transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-pastel-blue-dark/50';

    const variants = {
        primary: 'bg-pastel-peach text-slate-800 shadow-sm hover:translate-y-[-2px] hover:shadow-md hover:bg-pastel-peach-dark',
        secondary: 'bg-pastel-blue text-slate-800 shadow-sm hover:translate-y-[-2px] hover:shadow-md hover:bg-pastel-blue-dark',
        ghost: 'bg-transparent hover:bg-slate-100/80 hover:scale-105',
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], className)}
            {...props}
        />
    );
}
