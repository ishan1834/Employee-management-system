import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ModuleLayout from '@/components/ModuleLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Cake, Gift, PartyPopper } from 'lucide-react';

const BirthdayReminders: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [adminsData, setAdminsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
  const fetchData = async () => {
    const [employeesRes, adminEmployeesRes] = await Promise.all([
      supabase
        .from('employees')
        .select(
          'id, full_name, date_of_birth, department, designation, profile_image_url'
        ),
      supabase
        .from('admin_employee_data')
        .select(
          'admin_id, full_name, date_of_birth, department, designation'
        ),
    ]);

    setEmployees(employeesRes.data ?? []);
    setAdminsData(adminEmployeesRes.data ?? []);
    setLoading(false);
  };

  fetchData();
}, []);

  const today = new Date();
  const todayMD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const allPeople = [
    ...employees.filter(e => e.date_of_birth).map(e => ({ ...e, type: 'Employee' })),
    ...adminsData.filter(a => a.date_of_birth).map(a => ({ ...a, id: a.admin_id, type: 'Admin' }))
  ];

  const withBirthday = allPeople.map(p => {
    const dob = new Date(p.date_of_birth + 'T00:00:00');
    const md = `${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`;
    const isToday = md === todayMD;
    
    // Calculate days until next birthday
const nextBday = new Date(
  today.getFullYear(),
  dob.getMonth(),
  dob.getDate()
);

if (nextBday < today) {
  nextBday.setFullYear(today.getFullYear() + 1);
}

const daysUntil = Math.ceil(
  (nextBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
);

// Calculate age
let age = today.getFullYear() - dob.getFullYear();
const hasBirthdayPassed = (today.getMonth() > dob.getMonth()) || (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
if (!hasBirthdayPassed) {
  age -= 1;
}

return {
  ...p,
  isToday,
  daysUntil,
  birthdayDate: dob,
  age: age,
};
}).sort((a, b) => a.daysUntil - b.daysUntil);

const filtered = withBirthday.filter((p) => {
  const searchTerm = search.toLowerCase();

  return (
    p.full_name?.toLowerCase().includes(searchTerm) ||
    p.department?.toLowerCase().includes(searchTerm)
  );
});
  const todayBirthdays = filtered.filter(p => p.isToday);
  const upcoming = filtered.filter(p => !p.isToday && p.daysUntil <= 30);
  const others = filtered.filter(p => !p.isToday && p.daysUntil > 30);

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <ModuleLayout title="Birthday Reminders" description="Never miss a team member's birthday">
        
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search by name or department..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10" />
        </div>

        {loading ? <p className="text-gray-400">Loading...</p> : (
          <div className="space-y-6">
            {todayBirthdays.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2"><PartyPopper className="w-4 h-4" /> Today's Birthdays!</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {todayBirthdays.map(p => (
                    <Card key={p.id} className="border-yellow-500/30 bg-yellow-500/5 border-l-4 border-l-yellow-500">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <Cake className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">{p.full_name} 🎂</h3>
                          <p className="text-xs text-gray-400">{p.department} • {p.designation} • {p.type}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {upcoming.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2"><Gift className="w-4 h-4" /> Upcoming (Next 30 Days)</h3>
                <div className="space-y-2">
                  {upcoming.map(p => (
                    <Card key={p.id} className="border-white/10 bg-white/5">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">{p.full_name?.charAt(0)}</div>
                          <div>
                            <h4 className="text-sm font-medium text-white">{p.full_name}</h4>
                            <p className="text-xs text-gray-500">{p.department} • {p.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-white">{p.birthdayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                          <Badge className="bg-blue-500/20 text-blue-400 text-[10px]">In {p.daysUntil} days</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {others.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-3">All Birthdays</h3>
                <div className="space-y-1">
                  {others.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded text-sm">
                      <span className="text-gray-300">{p.full_name}</span>
                      <span className="text-xs text-gray-500">{p.birthdayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ({p.daysUntil}d)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filtered.length === 0 && <p className="text-gray-400">No birthday data available. Ensure date of birth is filled in employee/admin profiles.</p>}
          </div>
        )}
      </ModuleLayout>
    </div>
  );
};

export default BirthdayReminders;
