import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
    const baseStyles = 'px-4 py-2 rounded-full font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
        primary: 'bg-pastel-peach text-slate-800 shadow-sm hover:translate-y-[-2px] hover:shadow-md',
        secondary: 'bg-pastel-blue text-slate-800 shadow-sm hover:translate-y-[-2px] hover:shadow-md',
        ghost: 'bg-transparent hover:bg-slate-100',
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], className)}
            {...props}
        />
    );
}
