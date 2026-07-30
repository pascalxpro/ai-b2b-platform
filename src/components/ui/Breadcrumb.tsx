'use client';
import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import styles from './Breadcrumb.module.css';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className={styles.breadcrumb}>
      <Link href="/dashboard" className={styles.homeLink}>
        <Home size={14} />
      </Link>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <ChevronRight size={14} className={styles.separator} />
          {item.href ? (
            <Link href={item.href} className={styles.link}>{item.label}</Link>
          ) : (
            <span className={styles.current}>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
