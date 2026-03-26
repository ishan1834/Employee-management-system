import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Edit, Trash2, Search, Plus, Users, IndianRupee, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import ModuleLayout from '@/components/ModuleLayout';
import { useActivityLogger, ActivityActions } from '@/hooks/useActivityLogger';

const EsportsPlayersListPage: React.FC = () => {
  const navigate = useNavigate();

  const [players, setPlayers] = useState<any[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, paid: 0, totalFees: 0 });

  const { toast } = useToast();
  const { logActivity } = useActivityLogger();

  const itemsPerPage = 20;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
