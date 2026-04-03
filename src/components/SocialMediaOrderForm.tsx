
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface SocialMediaOrderFormProps {
  onOrderAdded: () => void;
  editingOrder?: any;
  onCancelEdit?: () => void;
}

const SocialMediaOrderForm: React.FC<SocialMediaOrderFormProps> = ({ onOrderAdded, editingOrder, onCancelEdit }) => {
  const [formData, setFormData] = useState({
    post_account_link: editingOrder?.post_account_link || '',
    service_type: editingOrder?.service_type || '',
    order_type: editingOrder?.order_type || '',
    quantity: editingOrder?.quantity || '',
    payment_amount: editingOrder?.payment_amount || '',
    payment_received: editingOrder?.payment_received || false
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const serviceTypes = ['instagram', 'youtube', 'facebook', 'telegram', 'twitter'];
  const orderTypes = ['likes', 'followers', 'comments', 'views'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const orderData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        payment_amount: parseFloat(formData.payment_amount)
      };

      if (editingOrder) {
        const { error } = await supabase
          .from('social_media_orders')
          .update(orderData)
          .eq('id', editingOrder.id);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Order updated successfully!",
        });
      } else {
        const { error } = await supabase
          .from('social_media_orders')
          .insert([orderData]);
        
        if (error) throw error;
        toast({
          title: "Success",
          description: "Order added successfully!",
        });
      }

      setFormData({
        post_account_link: '',
        service_type: '',
        order_type: '',
        quantity: '',
        payment_amount: '',
        payment_received: false
      });
      onOrderAdded();
      onCancelEdit?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save order data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


};

export default SocialMediaOrderForm;
