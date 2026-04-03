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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Social Media Orders ({totalCount} total)</span>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Order Type</TableHead>
                  <TableHead>Account Link</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.service_type}</TableCell>
                    <TableCell>{order.order_type}</TableCell>
                    <TableCell>{order.post_account_link}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>₹{order.payment_amount}</TableCell>
                    <TableCell>
                      {order.payment_received ? 'Paid' : 'Pending'}
                    </TableCell>
                    <TableCell>
                      <Button onClick={() => onEditOrder(order)}>
                        <Edit />
                      </Button>
                      <Button onClick={() => handleDelete(order.id)}>
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SocialMediaOrdersList;

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
    const filterOrders = () => {
    if (!searchTerm) {
      setFilteredOrders(orders);
      return;
    }
        const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      const { error } = await supabase
        .from('social_media_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order deleted successfully!",
      });

      fetchOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete order",
        variant: "destructive",
      });
    }
  };

    const filtered = orders.filter(order =>
      order.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.post_account_link.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredOrders(filtered);
  };
