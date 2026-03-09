import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export function RestaurantFAB({ onClick }: { onClick: () => void }) {
    return (
        <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-pastel-peach shadow-lg flex items-center justify-center hover:shadow-xl transition-all z-[2000] group"
            aria-label="Add restaurant"
        >
            <Plus className="w-8 h-8 text-slate-800 group-hover:rotate-90 transition-transform duration-500" />
        </motion.button>
    );
}
