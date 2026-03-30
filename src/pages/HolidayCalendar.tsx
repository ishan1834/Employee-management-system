import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useHolidays } from '@/hooks/useHolidays';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const HolidayCalendar: React.FC = () => {
  return <div>Holiday Calendar</div>;
};
const navigate = useNavigate();
const { adminProfile } = useAuth();
const { holidays, isLoading, addHoliday, deleteHoliday } = useHolidays();

const [isDialogOpen, setIsDialogOpen] = useState(false);
const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
const [formData, setFormData] = useState({
  name: '',
  description: '',
  is_recurring: false
});

const isSuperAdmin = adminProfile?.role === 'super_admin';
const isHRAdmin = (adminProfile?.role as string) === 'hr_admin';
const canManage = isSuperAdmin || isHRAdmin;

export default HolidayCalendar;
