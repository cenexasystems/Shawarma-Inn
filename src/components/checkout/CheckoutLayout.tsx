import React from 'react';

interface CheckoutLayoutProps {
  children: React.ReactNode;
}

export default function CheckoutLayout({ children }: CheckoutLayoutProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
      {children}
    </div>
  );
}
