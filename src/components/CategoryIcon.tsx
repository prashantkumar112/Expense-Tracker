import React from 'react';
import {
  CreditCard,
  Home,
  HeartHandshake,
  Building2,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  Landmark,
  Film,
  Activity,
  Utensils,
  MapPin,
  Car,
  Wifi,
  User,
  Briefcase,
  Laptop,
  CircleDollarSign,
  Building,
  Gift,
  Tag,
  DollarSign,
  Zap,
  Coffee,
  Plane,
  Book,
  Smartphone,
  Sparkles,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  CreditCard,
  Home,
  HeartHandshake,
  Building2,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  Landmark,
  Film,
  Activity,
  Utensils,
  MapPin,
  Car,
  Wifi,
  User,
  Briefcase,
  Laptop,
  CircleDollarSign,
  Building,
  Gift,
  Tag,
  DollarSign,
  Zap,
  Coffee,
  Plane,
  Book,
  Smartphone,
  Sparkles,
};

interface CategoryIconProps {
  iconName?: string;
  color?: string;
  size?: number;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  iconName = 'Tag',
  color = '#64748B',
  size = 18,
  className = '',
}) => {
  const IconComponent = ICON_MAP[iconName] || Tag;

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl p-2 transition-transform duration-200 ${className}`}
      style={{ backgroundColor: `${color}1A`, color: color }}
    >
      <IconComponent size={size} strokeWidth={2.2} />
    </div>
  );
};
