import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AccessRestrictedStateProps {
  title?: string;
  message?: string;
}

const AccessRestrictedState: React.FC<AccessRestrictedStateProps> = ({
  title = 'Access Restricted',
  message = 'Only Super Admins can access this module.',
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[320px] items-center justify-center py-8">
      <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-10 text-center shadow-sm">
        
        {/* Icon */}
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
          <ShieldAlert className="h-7 w-7 text-red-400" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-foreground">
          {title}
        </h3>

        {/* Message */}
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {message}
        </p>

        {/* Button */}
        <Button
          variant="outline"
          className="mt-6 border-white/10 bg-background/40 hover:bg-background/70"
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>

      </div>
    </div>
  );
};

export default AccessRestrictedState;