
  };

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 5000); return () => clearInterval(i); }, []);

  const handleCreate = async () => {
    if (!subject.trim() || !message.trim()) return;
    const { error } = await supabase.from('feedback' as any).insert({
      from_admin_id: adminProfile?.id, to_admin_id: toAdminId || null, subject, message,
      category, is_anonymous: isAnonymous
    } as any);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Feedback submitted!' });
    setSubject(''); setMessage(''); setCategory('general'); setToAdminId(''); setIsAnonymous(false); setShowForm(false);
    fetchData();
  };

  const handleRespond = async (id: string) => {
    if (!responseText.trim()) return;
    await supabase.from('feedback' as any).update({
      response: responseText, responded_by: adminProfile?.id, responded_at: new Date().toISOString(), status: 'resolved'
    } as any).eq('id', id);
    setResponseText(''); fetchData();
    toast({ title: 'Response sent!' });
  };

  const statusColors: Record<string, string> = {
    open: 'bg-blue-500/20 text-blue-400', resolved: 'bg-green-500/20 text-green-400', closed: 'bg-gray-500/20 text-gray-400'
  };

  const filtered = feedbacks.filter(f =>
    f.subject?.toLowerCase().includes(search.toLowerCase()) || f.message?.toLowerCase().includes(search.toLowerCase()) ||
    f.from?.name?.toLowerCase().includes(search.toLowerCase()) || f.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <ModuleLayout title="Feedback" description="Share feedback and suggestions"
        actions={<Button onClick={() => setShowForm(!showForm)} size="sm"><Plus className="w-4 h-4 mr-1" /> New Feedback</Button>}>
        
        {showForm && (
          <Card className="mb-6 border-white/10 bg-white/5">
            <CardContent className="p-4 space-y-3">
              <Input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} className="bg-white/5 border-white/10" />
              <Textarea placeholder="Your feedback..." value={message} onChange={e => setMessage(e.target.value)} className="bg-white/5 border-white/10" />
              <div className="flex gap-3 flex-wrap items-center">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-32 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="general">General</SelectItem><SelectItem value="suggestion">Suggestion</SelectItem><SelectItem value="bug">Bug Report</SelectItem><SelectItem value="appreciation">Appreciation</SelectItem></SelectContent>
                </Select>
                <Select value={toAdminId} onValueChange={setToAdminId}>
                  <SelectTrigger className="w-40 bg-white/5 border-white/10"><SelectValue placeholder="To (optional)" /></SelectTrigger>
                  <SelectContent>{admins.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} /> Anonymous
                </label>
                <Button onClick={handleCreate} size="sm">Submit</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search feedback..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10" />
        </div>

        {loading ? <p className="text-gray-400">Loading...</p> : filtered.length === 0 ? <p className="text-gray-400">No feedback yet.</p> : (
          <div className="space-y-3">
            {filtered.map(fb => (
              <Card key={fb.id} className="border-white/10 bg-white/5">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-white">{fb.subject}</h3>
                      <p className="text-xs text-gray-500">
                        {fb.is_anonymous ? 'Anonymous' : fb.from?.name} {fb.to?.name ? `→ ${fb.to.name}` : ''} • {fb.category} • {new Date(fb.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={statusColors[fb.status] || statusColors.open}>{fb.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{fb.message}</p>
                  {fb.response && (
                    <div className="bg-white/5 rounded p-2 mt-2">
                      <p className="text-xs text-gray-400">Response by {fb.responder?.name}:</p>
                      <p className="text-sm text-green-300">{fb.response}</p>
                    </div>
                  )}
                  {isSuperAdmin && fb.status === 'open' && (
                    <div className="flex gap-2 mt-2">
                      <Input placeholder="Write response..." value={responseText} onChange={e => setResponseText(e.target.value)} className="bg-white/5 border-white/10 text-sm" />
                      <Button size="sm" onClick={() => handleRespond(fb.id)}><Send className="w-4 h-4" /></Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ModuleLayout>
    </div>
  );
};

export default FeedbackSystem;
