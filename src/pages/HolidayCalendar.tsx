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
import { format } from 'date-fns';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedDate || !formData.name) return;

  const result = await addHoliday({
    date: format(selectedDate, 'yyyy-MM-dd'),
    name: formData.name,
    description: formData.description || undefined,
    is_recurring: formData.is_recurring
  });

  if (result) {
    setIsDialogOpen(false);
    setFormData({ name: '', description: '', is_recurring: false });
  }
};

const handleDelete = async (id: string) => {
  if (!confirm('Are you sure you want to delete this holiday?')) return;
  await deleteHoliday(id);
};

const holidayDates = holidays.map(h => new Date(h.date));

export default HolidayCalendar;
