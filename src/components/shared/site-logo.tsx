
"use client";

import Link from 'next/link';
import { cn } from "@/lib/utils";
import Image from 'next/image';

interface SiteLogoProps {
  className?: string;
  width?: number;
}

const LOGO_URL = "https://i.imgur.com/nYa6CuK.png";

export function SiteLogo({ className, width = 70 }: SiteLogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 hover:opacity-90 transition-opacity", className)}>
        <div style={{ width: `${width}px`, position: 'relative' }}>
            <Image
                src={LOGO_URL}
                alt="Videre Logo"
                width={886} // Original width for aspect ratio
                height={300} // Original height for aspect ratio
                sizes="(max-width: 768px) 80px, 100px"
                style={{
                    width: '100%',
                    height: 'auto',
                }}
                priority
            />
        </div>
    </Link>
  );
}
