"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, CalendarClock, Settings2 } from "lucide-react";
import Link from "next/link";
import { format, differenceInDays, addYears, isPast, isToday } from "date-fns";

interface AnniversaryWidgetProps {
  daysTogether: number;
  anniversaryDate: string | null;
}

export function AnniversaryWidget({ daysTogether, anniversaryDate }: AnniversaryWidgetProps) {
  const getNextAnniversary = () => {
    if (!anniversaryDate) return null;
    const anniv = new Date(anniversaryDate);
    const today = new Date();
    
    // Set to current year
    let nextAnniv = new Date(today.getFullYear(), anniv.getMonth(), anniv.getDate());
    
    // If it's passed this year, it's next year
    if (isPast(nextAnniv) && !isToday(nextAnniv)) {
      nextAnniv = addYears(nextAnniv, 1);
    }
    
    return nextAnniv;
  };

  const nextAnniv = getNextAnniversary();
  const daysUntil = nextAnniv ? differenceInDays(nextAnniv, new Date()) : null;

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-500 to-pink-600 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Heart className="w-48 h-48 -rotate-12 transform translate-x-12 -translate-y-12" fill="currentColor" />
      </div>
      
      <CardContent className="p-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-2 w-full md:w-auto text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-bold flex items-center justify-center md:justify-start gap-3">
            {daysTogether.toLocaleString()} <span className="text-xl md:text-2xl font-medium opacity-90">days together</span>
          </h2>
          {anniversaryDate ? (
            <p className="text-rose-100 flex items-center justify-center md:justify-start gap-2">
              <CalendarClock className="w-4 h-4" />
              {daysUntil === 0 
                ? "Happy Anniversary! 🎉" 
                : `${daysUntil} days until your next anniversary (${format(nextAnniv!, "MMMM do")})`}
            </p>
          ) : (
            <p className="text-rose-100 flex items-center justify-center md:justify-start gap-2 text-sm">
              <Settings2 className="w-4 h-4" />
              Set your anniversary date in settings to see your countdown
            </p>
          )}
        </div>

        {!anniversaryDate && (
          <Button 
            asChild 
            variant="secondary" 
            className="bg-white text-rose-600 hover:bg-rose-50 border-0 font-medium whitespace-nowrap"
          >
            <Link href="/settings">
              Set Anniversary Date
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
