import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useHolidays } from '@/hooks/useHolidays';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const HolidayCalendar: React.FC = () => {
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

  // Get holiday dates for calendar highlighting
  const holidayDates = holidays.map(h => new Date(h.date));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Holiday Calendar</h1>
            <p className="text-gray-400 mt-1">
              Manage company holidays (excluded from attendance calculations)
            </p>
          </div>
          
          {canManage && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Holiday
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Add New Holiday</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Select Date</Label>
                    <div className="mt-2 flex justify-center">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="rounded-md border border-gray-700"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="name" className="text-gray-300">Holiday Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="e.g., Diwali, Christmas"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-gray-300">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Optional description..."
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Recurring Yearly</Label>
                      <p className="text-xs text-gray-500">This holiday repeats every year</p>
                    </div>
                    <Switch
                      checked={formData.is_recurring}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_recurring: checked }))}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                      Add Holiday
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar View */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-500" />
                Calendar View
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="multiple"
                selected={holidayDates}
                className="rounded-md border border-gray-700"
                modifiers={{
                  holiday: holidayDates
                }}
                modifiersStyles={{
                  holiday: { backgroundColor: 'rgba(59, 130, 246, 0.3)', color: 'white', fontWeight: 'bold' }
                }}
              />
            </CardContent>
          </Card>

          {/* Holiday List */}
          <Card className="lg:col-span-2 bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">All Holidays ({holidays.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {holidays.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No holidays added yet</p>
                  {canManage && <p className="text-sm">Click "Add Holiday" to get started</p>}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-400">Date</TableHead>
                      <TableHead className="text-gray-400">Name</TableHead>
                      <TableHead className="text-gray-400">Description</TableHead>
                      <TableHead className="text-gray-400">Type</TableHead>
                      {canManage && <TableHead className="text-gray-400">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holidays.map((holiday) => (
                      <TableRow key={holiday.id} className="border-gray-700">
                        <TableCell className="text-white font-medium">
                          {format(new Date(holiday.date), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell className="text-white">{holiday.name}</TableCell>
                        <TableCell className="text-gray-400">{holiday.description || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={holiday.is_recurring ? 'default' : 'secondary'}>
                            {holiday.is_recurring ? 'Recurring' : 'One-time'}
                          </Badge>
                        </TableCell>
                        {canManage && (
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(holiday.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HolidayCalendar;
