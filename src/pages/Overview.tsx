

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

