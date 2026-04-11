import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";


import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
export type CalendarProps = React.ComponentProps<typeof DayPicker>;
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
