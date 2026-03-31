import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ModuleLayout from '@/components/ModuleLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, GripVertical, Trash2, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const columns = [
  { key: 'todo', label: 'To Do', color: 'border-t-blue-500' },
  { key: 'in_progress', label: 'In Progress', color: 'border-t-yellow-500' },
  { key: 'review', label: 'Review', color: 'border-t-purple-500' },
  { key: 'done', label: 'Done', color: 'border-t-green-500' }
