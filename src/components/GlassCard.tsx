import { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className, hoverEffect = true, onClick }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hoverEffect ? { scale: 1.01, translateY: -2 } : undefined}
      onClick={onClick}
      className={cn(
        "glass-card p-6 overflow-visible relative",
        !hoverEffect && "hover:bg-white/5 hover:border-white/10 hover:shadow-none",
        className
      )}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}
