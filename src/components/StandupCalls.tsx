

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';


import {
  Video,
  Mic,
  MicOff,
  Eye,
  EyeOff,
  Monitor,
  Phone,
  Share2,
  MessageSquare,
  Users,
  Loader2,
  Plus,
  X,
  Clock,
  MapPin,
  Copy,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';


import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import {
  createStandupCall,
  getActiveStandupCalls,
  getStandupCallById,
  startStandupCall,
  endStandupCall,
  joinStandupCall,
  leaveStandupCall,
  updateParticipantStatus,
  getCallParticipants,
  sendStandupCallMessage,
  getCallMessages,
  subscribeToStandupCalls,
  subscribeToParticipantUpdates,
  subscribeToCallMessages
} from '@/integrations/supabase/standupCallsService';
import { checkStandupCallsMigration, getMigrationHelpMessage } from '@/integrations/supabase/migrationCheck';




const StandupCalls: React.FC = () => {
  const { user, adminProfile } = useAuth();
  const navigate = useNavigate();




  
  const [activeCalls, setActiveCalls] = useState<any[]>([]);
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');


  
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [migrationStatus, setMigrationStatus] = useState<{ isMigrated: boolean; missingTables: string[] } | null>(null);


  
  const [createForm, setCreateForm] = useState({
    title: 'Daily Standup',
    description: '',
    scheduledTime: new Date().toISOString()
  });

  // Check migration status on mount

  
  useEffect(() => {
    const checkMigration = async () => {
      const status = await checkStandupCallsMigration();
      setMigrationStatus(status);
      console.log('Migration status:', status);
    };
    checkMigration();
  }, []);

  // Fetch active calls


  
  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const calls = await getActiveStandupCalls();
        setActiveCalls(calls || []);
        if (calls && calls.length > 0 && !selectedCall) {
          setSelectedCall(calls[0]);
        }
      } catch (error) {
        console.error('Error fetching calls:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalls();

    // Subscribe to real-time updates


    
    const subscription = subscribeToStandupCalls((payload: any) => {
      fetchCalls();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);



  
  // Fetch selected call details



  
  useEffect(() => {
    if (!selectedCall) return;

    const fetchCallDetails = async () => {
      try {
        const callDetails = await getStandupCallById(selectedCall.id);
        setSelectedCall(callDetails);
        
        const callParticipants = await getCallParticipants(selectedCall.id);
        setParticipants(callParticipants || []);
        
        const callMessages = await getCallMessages(selectedCall.id);
        setMessages(callMessages || []);
      } catch (error) {
        console.error('Error fetching call details:', error);
      }
    };

    fetchCallDetails();



    
    // Subscribe to participant updates


    
    const participantSub = subscribeToParticipantUpdates(selectedCall.id, () => {
      fetchCallDetails();
    });


    

    // Subscribe to message updates


    
    const messageSub = subscribeToCallMessages(selectedCall.id, () => {
      fetchCallDetails();
    });

    return () => {
      participantSub.unsubscribe();
      messageSub.unsubscribe();
    };
  }, [selectedCall?.id]);

  const handleCreateCall = async () => {
    if (!adminProfile) {
      alert('Admin profile not found. Please refresh the page.');
      return;
    }
    
    if (!createForm.title.trim()) {
      alert('Please enter a title for the standup call');
      return;
    }
    
    try {
      setIsCreating(true);
      console.log('Creating call with:', {
        adminId: adminProfile.id,
        title: createForm.title,
        description: createForm.description,
        scheduledTime: new Date(createForm.scheduledTime)
      });

      const newCall = await createStandupCall(
        adminProfile.id,
        createForm.title,
        createForm.description,
        new Date(createForm.scheduledTime)
      );

      console.log('Call created successfully:', newCall);



      
      // Start the call immediately


      

      
      const startedCall = await startStandupCall(newCall.id);
      console.log('Call started:', startedCall);



      
      
      // Fetch updated calls


      
      const calls = await getActiveStandupCalls();
      console.log('Active calls after creation:', calls);
      
      setActiveCalls(calls || []);
      setSelectedCall(startedCall);
      setShowCreateModal(false);
      setCreateForm({
        title: 'Daily Standup',
        description: '',
        scheduledTime: new Date().toISOString()
      });
      
      alert('Standup call started successfully!');
    } catch (error) {
      console.error('Full error object:', error);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      } else if (typeof error === 'object' && error !== null) {
        const errorObj = error as any;
        errorMessage = errorObj.message || errorObj.error_description || errorObj.details || JSON.stringify(error);
        console.error('Error object:', errorObj);
      }
      
      alert(`Failed to create standup call:\n\n${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };



  
  const handleJoinCall = async (callId: string) => {
    if (!adminProfile) return;
    
    try {
      await joinStandupCall(callId, adminProfile.id);
      const callDetails = await getStandupCallById(callId);
      setSelectedCall(callDetails);
      
      const callParticipants = await getCallParticipants(callId);
      setParticipants(callParticipants || []);
    } catch (error) {
      console.error('Error joining call:', error);
    }
  };

  const handleLeaveCall = async () => {
    if (!adminProfile || !selectedCall) return;
    
    try {
      await leaveStandupCall(selectedCall.id, adminProfile.id);
      const callParticipants = await getCallParticipants(selectedCall.id);
      setParticipants(callParticipants || []);
    } catch (error) {
      console.error('Error leaving call:', error);
    }
  };

  const handleToggleMute = async () => {
    if (!adminProfile || !selectedCall) return;
    
    try {
      await updateParticipantStatus(selectedCall.id, adminProfile.id, {
        is_muted: !isMuted
      });
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const handleToggleVideo = async () => {
    if (!adminProfile || !selectedCall) return;
    
    try {
      await updateParticipantStatus(selectedCall.id, adminProfile.id, {
        is_video_on: !isVideoOn
      });
      setIsVideoOn(!isVideoOn);
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  };

  const handleToggleScreenShare = async () => {
    if (!adminProfile || !selectedCall) return;
    
    try {
      await updateParticipantStatus(selectedCall.id, adminProfile.id, {
        is_screen_sharing: !isScreenSharing
      });
      setIsScreenSharing(!isScreenSharing);
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const handleTogglePresentMode = async () => {
    if (!adminProfile || !selectedCall) return;
    
    try {
      await updateParticipantStatus(selectedCall.id, adminProfile.id, {
        is_presenting: !isPresenting
      });
      setIsPresenting(!isPresenting);
    } catch (error) {
      console.error('Error toggling present mode:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !adminProfile || !selectedCall) return;
    
    try {
      await sendStandupCallMessage(selectedCall.id, adminProfile.id, messageInput);
      setMessageInput('');
      
      const callMessages = await getCallMessages(selectedCall.id);
      setMessages(callMessages || []);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleEndCall = async () => {
    if (!selectedCall) return;
    
    try {
      await endStandupCall(selectedCall.id);
      const calls = await getActiveStandupCalls();
      setActiveCalls(calls || []);
      setSelectedCall(null);
      setParticipants([]);
      setMessages([]);
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  const copyMeetLink = async () => {
    if (selectedCall?.google_meet_url) {
      try {
        await navigator.clipboard.writeText(selectedCall.google_meet_url);
        alert('Meet link copied to clipboard!');
      } catch (error) {
        console.error('Error copying link:', error);
      }
    }
  };

  if (!user || !adminProfile) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Migration Alert */}
        {migrationStatus && !migrationStatus.isMigrated && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="ml-2 text-amber-400">
              <strong>Database Migration Required:</strong> The standup calls tables haven't been created yet.
              <details className="mt-2 cursor-pointer">
                <summary className="text-xs underline">Show setup instructions</summary>
                <pre className="mt-2 bg-black/50 p-2 rounded text-xs whitespace-pre-wrap text-amber-300">
                  {getMigrationHelpMessage(migrationStatus.missingTables)}
                </pre>
              </details>
            </AlertDescription>
          </Alert>
        )}



        
        {/* Header */}



        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Daily Standup Calls</h1>
            <p className="text-muted-foreground">
              Join live team standups and collaborate with real-time controls
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Start New Standup
          </Button>
        </div>


        

        {/* Create Modal */}


        
        {showCreateModal && (
          <Card className="mb-8 border-primary/50 bg-black/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Start a New Standup Call</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="Daily Standup"
                    className="bg-black/50 border-white/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Add optional description"
                    className="bg-black/50 border-white/20"
                  />
                </div>
                <div className="flex gap-4">
                  <Button
                    onClick={handleCreateCall}
                    disabled={isCreating}
                    className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Video className="mr-2 h-4 w-4" />
                        Start Call
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowCreateModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">



          
          {/* Active Calls List */}



          
          <div>
            <Card className="bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Active Standups
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : activeCalls.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No active standups yet. Start one to begin!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeCalls.map((call) => (
                      <button
                        key={call.id}
                        onClick={() => setSelectedCall(call)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          selectedCall?.id === call.id
                            ? 'bg-primary/20 border border-primary/50'
                            : 'bg-black/20 border border-white/10 hover:border-white/20'
                        }`}
                      >
                        <p className="font-semibold text-sm text-white">{call.title}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{call.participants?.length || 0} participants</span>
                        </div>
                        <Badge className="mt-2 bg-green-500/20 text-green-400 border-0">
                          {call.status}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>


          
          {/* Main Call View */}



          
          <div className="lg:col-span-2">
            {selectedCall ? (
              <div className="space-y-6">
                {/* Video Area */}
                <Card className="bg-black/60 border-white/10">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center relative overflow-hidden">
                      <div className="text-center">
                        <Video className="h-16 w-16 mx-auto mb-4 text-primary/50" />
                        <p className="text-white font-semibold mb-4">Google Meet Integration</p>
                        <Button
                          onClick={() => window.open(selectedCall.google_meet_url, '_blank')}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open in Google Meet
                        </Button>
                        <p className="text-xs text-muted-foreground mt-4">
                          Full meet controls available in Google Meet tab
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>



                
                {/* Call Info */}



                
                <Card className="bg-black/40 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg">{selectedCall.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-mono text-xs">{selectedCall.google_meet_id}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyMeetLink}
                        className="ml-auto"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>
                        {new Date(selectedCall.scheduled_start_time).toLocaleTimeString()}
                      </span>
                    </div>
                    {selectedCall.description && (
                      <div className="text-sm text-muted-foreground">
                        {selectedCall.description}
                      </div>
                    )}
                  </CardContent>
                </Card>



                
                {/* Controls */}



                
                <Card className="bg-black/40 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg">Meeting Controls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={handleToggleMute}
                        variant={isMuted ? 'outline' : 'default'}
                        className={isMuted ? 'bg-red-500/20 border-red-500/50' : 'bg-primary/20'}
                      >
                        {isMuted ? (
                          <>
                            <MicOff className="mr-2 h-4 w-4" />
                            Unmute
                          </>
                        ) : (
                          <>
                            <Mic className="mr-2 h-4 w-4" />
                            Mute
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleToggleVideo}
                        variant={isVideoOn ? 'default' : 'outline'}
                        className={isVideoOn ? 'bg-primary/20' : 'bg-red-500/20 border-red-500/50'}
                      >
                        {isVideoOn ? (
                          <>
                            <Video className="mr-2 h-4 w-4" />
                            Camera On
                          </>
                        ) : (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Camera Off
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleToggleScreenShare}
                        variant={isScreenSharing ? 'default' : 'outline'}
                        className={isScreenSharing ? 'bg-primary/20' : 'bg-black/20 border-white/20'}
                      >
                        {isScreenSharing ? (
                          <>
                            <Monitor className="mr-2 h-4 w-4" />
                            Stop Share
                          </>
                        ) : (
                          <>
                            <Share2 className="mr-2 h-4 w-4" />
                            Share Screen
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleTogglePresentMode}
                        variant={isPresenting ? 'default' : 'outline'}
                        className={isPresenting ? 'bg-primary/20' : 'bg-black/20 border-white/20'}
                      >
                        {isPresenting ? (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Presenting
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Present
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={handleLeaveCall}
                        variant="outline"
                        className="flex-1"
                      >
                        <Phone className="mr-2 h-4 w-4" />
                        Leave Call
                      </Button>
                      {selectedCall.initiated_by === adminProfile?.id && (
                        <Button
                          onClick={handleEndCall}
                          variant="destructive"
                          className="flex-1"
                        >
                          End for Everyone
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-black/40 border-white/10">
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Select a call to view details and join
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>




        
        {/* Participants & Chat */}




        
        {selectedCall && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">


            
            {/* Participants */}


            
            <Card className="lg:col-span-1 bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participants ({participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-white/10"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {participant.admin?.name}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {participant.is_muted && (
                            <MicOff className="h-3 w-3 text-red-400" />
                          )}
                          {participant.is_video_on && (
                            <Video className="h-3 w-3 text-green-400" />
                          )}
                          {participant.is_screen_sharing && (
                            <Monitor className="h-3 w-3 text-blue-400" />
                          )}
                          {participant.is_presenting && (
                            <Eye className="h-3 w-3 text-yellow-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>



            
            {/* Chat */}



            
            <Card className="lg:col-span-2 bg-black/40 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col h-80">
                <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                  {messages.map((message) => (
                    <div key={message.id} className="p-3 bg-black/30 rounded-lg border border-white/10">
                      <p className="text-sm font-medium text-primary">
                        {message.admin?.name}
                      </p>
                      <p className="text-sm text-white mt-1">{message.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="bg-black/50 border-white/20"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
};



export default StandupCalls;
