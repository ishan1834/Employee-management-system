import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Edit, Trash2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface SocialMediaOrdersListProps {
  onEditOrder: (order: any) => void;
  refreshTrigger: number;
}

const SocialMediaOrdersList: React.FC<SocialMediaOrdersListProps> = ({ onEditOrder, refreshTrigger }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const itemsPerPage = 50;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
    useEffect(() => {
    fetchOrders();
  }, [refreshTrigger, currentPage]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { count } = await supabase
        .from('social_media_orders')
        .select('*', { count: 'exact', head: true });

      setTotalCount(count || 0);

      const { data, error } = await supabase
        .from('social_media_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
