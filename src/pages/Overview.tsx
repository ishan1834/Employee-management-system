

  const fetchOverviewStats = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all data sources
      const [
        { data: paymentVerifications },
        { data: esportsPlayers },
        { data: socialOrders }
      ] = await Promise.all([
        supabase.from('payment_verifications').select('*'),
        supabase.from('esports_players').select('*'),
        supabase.from('social_media_orders').select('*')
      ]);

      // Calculate real revenue from all sources
      const paymentRevenue = (paymentVerifications as any[])?.filter(p => p.payment_received).reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const esportsRevenue = (esportsPlayers as any[])?.filter(p => p.payment_received).reduce((sum, p) => sum + (p.entry_fees || 0), 0) || 0;
      const socialRevenue = (socialOrders as any[])?.filter(o => o.payment_received).reduce((sum, o) => sum + (o.payment_amount || 0), 0) || 0;

      const totalRevenue = paymentRevenue + esportsRevenue + socialRevenue;

      // Calculate pending orders from all sources
      const pendingPayments = (paymentVerifications as any[])?.filter(p => !p.payment_received).length || 0;
      const pendingEsports = (esportsPlayers as any[])?.filter(p => !p.payment_received).length || 0;
      const pendingSocial = (socialOrders as any[])?.filter(o => !o.payment_received).length || 0;
      
      const pendingOrders = pendingPayments + pendingEsports + pendingSocial;

      // Calculate total transactions
      const totalTransactions = ((paymentVerifications as any[])?.filter(p => p.payment_received).length || 0) +
                               ((esportsPlayers as any[])?.filter(p => p.payment_received).length || 0) +
                               ((socialOrders as any[])?.filter(o => o.payment_received).length || 0);

      // Calculate monthly growth
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      // Calculate this month's revenue
      const thisMonthPayments = (paymentVerifications as any[])?.filter(p => 
        p.payment_received && p.verified_at && p.verified_at >= firstDayThisMonth
      ).reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      const thisMonthEsports = (esportsPlayers as any[])?.filter(p => 
        p.payment_received && p.created_at >= firstDayThisMonth
      ).reduce((sum, p) => sum + (p.entry_fees || 0), 0) || 0;

      const thisMonthSocial = (socialOrders as any[])?.filter(o => 
        o.payment_received && o.created_at >= firstDayThisMonth
      ).reduce((sum, o) => sum + (o.payment_amount || 0), 0) || 0;

      const thisMonthRevenue = thisMonthPayments + thisMonthEsports + thisMonthSocial;

      // Calculate last month's revenue
      const lastMonthPayments = (paymentVerifications as any[])?.filter(p => 
        p.payment_received && p.verified_at && p.verified_at >= firstDayLastMonth && p.verified_at < firstDayThisMonth
      ).reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      const lastMonthEsports = (esportsPlayers as any[])?.filter(p => 
        p.payment_received && p.created_at >= firstDayLastMonth && p.created_at < firstDayThisMonth
      ).reduce((sum, p) => sum + (p.entry_fees || 0), 0) || 0;

      const lastMonthSocial = (socialOrders as any[])?.filter(o => 
        o.payment_received && o.created_at >= firstDayLastMonth && o.created_at < firstDayThisMonth
      ).reduce((sum, o) => sum + (o.payment_amount || 0), 0) || 0;

      const lastMonthRevenue = lastMonthPayments + lastMonthEsports + lastMonthSocial;

      const monthlyGrowth = lastMonthRevenue > 0 ? 
        Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 
        (thisMonthRevenue > 0 ? 100 : 0);

      setStats({
        totalRevenue,
        pendingOrders,
        totalTransactions,
        monthlyGrowth
      });
    } catch (error) {
      console.error('Error fetching overview stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ModuleLayout
        title="Overview Stats"
        description="Role-specific summary cards showing performance metrics"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="gradient-card border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout
      title="Overview Stats"
      description="Role-specific summary cards showing performance metrics"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="gradient-card border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:border-purple-500/60 hover:shadow-[0_0_25px_rgba(168,85,247,0.4),0_0_45px_rgba(255,255,255,0.25)] transition-all duration-300 ease-out">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-gradient">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="gradient-card border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:border-purple-500/60 hover:shadow-[0_0_25px_rgba(168,85,247,0.4),0_0_45px_rgba(255,255,255,0.25)] transition-all duration-300 ease-out">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold text-gradient">{stats.pendingOrders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:border-purple-500/60 hover:shadow-[0_0_25px_rgba(168,85,247,0.4),0_0_45px_rgba(255,255,255,0.25)] transition-all duration-300 ease-out">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold text-gradient">{stats.totalTransactions}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

