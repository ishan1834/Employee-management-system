
import React, { useState, useEffect } from 'react';
import ModuleLayout from '@/components/ModuleLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, DollarSign, ShoppingCart, Activity } from 'lucide-react';

const Analytics: React.FC = () => {
  type AnalyticsData = {
  esportsRevenue: number;
  socialRevenue: number;
  paymentRevenue: number;
  totalOrders: number;
  totalTransactions: number;
  totalRevenue: number;
  monthlyGrowth: number;
};

const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
  esportsRevenue: 0,
  socialRevenue: 0,
  paymentRevenue: 0,
  totalOrders: 0,
  totalTransactions: 0,
  totalRevenue: 0,
  monthlyGrowth: 0,
});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRealAnalyticsData();
    
    // Real-time subscription for all relevant tables
    const channel = supabase
      .channel('analytics-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'esports_players' },
        () => fetchRealAnalyticsData()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'social_media_orders' },
        () => fetchRealAnalyticsData()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'payment_verifications' },
        () => fetchRealAnalyticsData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRealAnalyticsData = async () => {
    try {
      const [
        esportsResult,
        socialResult,
        paymentResult
      ] = await Promise.allSettled([
        supabase.from('esports_players').select('entry_fees, payment_received, created_at'),
        supabase.from('social_media_orders').select('payment_amount, payment_received, quantity, created_at'),
        supabase.from('payment_verifications').select('amount, payment_received, verified_at, created_at')
      ]);

      // Process successful results
      const esportsData = esportsResult.status === 'fulfilled' ? esportsResult.value.data || [] : [];
      const socialData = socialResult.status === 'fulfilled' ? socialResult.value.data || [] : [];
      const paymentData = paymentResult.status === 'fulfilled' ? paymentResult.value.data || [] : [];

      // Calculate revenues from real data
      const esportsRevenue = esportsData
        .filter(item => item.payment_received)
        .reduce((sum, item) => sum + (item.entry_fees || 0), 0);

      const socialRevenue = socialData
        .filter(item => item.payment_received)
        .reduce((sum, item) => sum + (item.payment_amount || 0), 0);

      const paymentRevenue = paymentData
        .filter(item => item.payment_received)
        .reduce((sum, item) => sum + (item.amount || 0), 0);

      const totalRevenue = esportsRevenue + socialRevenue + paymentRevenue;
      
      // Calculate total orders from real data
      const totalOrders = socialData.reduce((sum, item) => sum + (item.quantity || 0), 0) + 
                         esportsData.length + paymentData.length;
      
      const totalTransactions = esportsData.filter(e => e.payment_received).length + 
                               socialData.filter(s => s.payment_received).length + 
                               paymentData.filter(p => p.payment_received).length;

      // Calculate real monthly growth
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      const allData = [
        ...esportsData.filter(e => e.payment_received).map(e => ({ ...e, revenue: e.entry_fees })),
        ...socialData.filter(s => s.payment_received).map(s => ({ ...s, revenue: s.payment_amount })),
        ...paymentData.filter(p => p.payment_received).map(p => ({ ...p, revenue: p.amount }))
      ];

      const thisMonthRevenue = allData
        .filter(item => item.created_at >= firstDayThisMonth)
        .reduce((sum, item) => sum + (item.revenue || 0), 0);

      const lastMonthRevenue = allData
        .filter(item => item.created_at >= firstDayLastMonth && item.created_at < firstDayThisMonth)
        .reduce((sum, item) => sum + (item.revenue || 0), 0);

      const monthlyGrowth = lastMonthRevenue > 0 ? 
        Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 
        (thisMonthRevenue > 0 ? 100 : 0);

      setAnalyticsData({
        esportsRevenue,
        socialRevenue,
        paymentRevenue,
        totalOrders,
        totalTransactions,
        totalRevenue,
        monthlyGrowth
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const revenueData = [
    { domain: 'Esports Tournaments', value: analyticsData.esportsRevenue },
    { domain: 'Social Media Orders', value: analyticsData.socialRevenue },
    { domain: 'Payment Verifications', value: analyticsData.paymentRevenue }
  ].filter(item => item.value > 0);

  const pieColors = ['#8b5cf6', '#06b6d4', '#10b981'];

  if (isLoading) {
  return (
    <ModuleLayout
      title="Analytics Dashboard"
      description="Loading analytics data..."
    >
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    </ModuleLayout>
  );
}

  return (
    <ModuleLayout
      title="Analytics Dashboard"
      description="Real-time revenue breakdown, earnings graphs, and performance analytics"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="gradient-card border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-gradient">₹{analyticsData.totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="gradient-card border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-gradient">{analyticsData.totalOrders}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Transactions</p>
                  <p className="text-2xl font-bold text-gradient">{analyticsData.totalTransactions}</p>
                </div>
                <Activity className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Growth</p>
                  <p className="text-2xl font-bold text-green-400">{analyticsData.monthlyGrowth >= 0 ? '+' : ''}{analyticsData.monthlyGrowth}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Bar Chart */}
          <Card className="gradient-card border-white/10">
            <CardHeader>
              <CardTitle>Revenue by Domain</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="domain" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No revenue data available yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Domain Distribution Pie Chart */}
          <Card className="gradient-card border-white/10">
            <CardHeader>
              <CardTitle>Revenue Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ domain, percent }) => `${domain} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No revenue data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ModuleLayout>
  );
};

export default Analytics;