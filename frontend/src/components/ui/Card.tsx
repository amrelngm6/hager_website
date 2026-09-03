import { clsx } from 'clsx';
import { ReactNode } from 'react';

interface CardProps {
  className?: string;
  children: ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={clsx('bg-white rounded-xl border border-gray-200 shadow-sm', className)}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  btn?: ReactNode;
}

export function CardHeader({ title, description, action, btn }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-gray-500 mt-0.5">{description}</p>}
      </div>
      {action && <div>{action}</div>}
      {btn && <div>{btn}</div>}
    </div>
  );
}

export function CardContent({ className, children }: CardProps) {
  return <div className={clsx('px-5 py-4', className)}>{children}</div>;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: string;
}

export function StatCard({ label, value, icon, color = 'bg-indigo-50 text-indigo-600' }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={clsx('w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className=" text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
