import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import {
  Instagram, Youtube, Facebook, Twitter, Send,
  Link2, ShoppingBag, Hash, Eye, Heart, Users,
  MessageCircle, IndianRupee, CheckCircle2, X,
  Loader2, Plus, Pencil, ChevronDown
} from 'lucide-react';

interface SocialMediaOrderFormProps {
  onOrderAdded: () => void;
  editingOrder?: any;
  onCancelEdit?: () => void;
}

/* 🔥 base pricing (auto calc) */
const BASE_PRICE: Record<string, number> = {
  likes: 0.1,
  followers: 0.5,
  views: 0.05,
  comments: 1,
};

/* platforms */
const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', Icon: Instagram, gradient: 'from-pink-600 to-orange-500', glow: 'rgba(236,72,153,0.3)' },
  { value: 'youtube',   label: 'YouTube',   Icon: Youtube,   gradient: 'from-red-600 to-rose-500',    glow: 'rgba(239,68,68,0.3)' },
  { value: 'facebook',  label: 'Facebook',  Icon: Facebook,  gradient: 'from-blue-600 to-blue-500',   glow: 'rgba(59,130,246,0.3)' },
  { value: 'telegram',  label: 'Telegram',  Icon: Send,      gradient: 'from-sky-600 to-cyan-500',    glow: 'rgba(14,165,233,0.3)' },
  { value: 'twitter',   label: 'Twitter/X', Icon: Twitter,   gradient: 'from-slate-600 to-slate-400', glow: 'rgba(148,163,184,0.3)' },
];

const ORDER_TYPES = [
  { value: 'likes', label: 'Likes', Icon: Heart, color: 'text-rose-400' },
  { value: 'followers', label: 'Followers', Icon: Users, color: 'text-sky-400' },
  { value: 'comments', label: 'Comments', Icon: MessageCircle, color: 'text-amber-400' },
  { value: 'views', label: 'Views', Icon: Eye, color: 'text-violet-400' },
];

const SocialMediaOrderForm: React.FC<SocialMediaOrderFormProps> = ({
  onOrderAdded, editingOrder, onCancelEdit
}) => {

  const [formData, setFormData] = useState({
    post_account_link: '',
    service_type: '',
    order_type: '',
    quantity: '',
    payment_amount: '',
    payment_received: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [successPulse, setSuccessPulse] = useState(false);
  const { toast } = useToast();

  /* 🔥 remember last platform */
  useEffect(() => {
    const saved = localStorage.getItem('last_platform');
    if (saved) setFormData(p => ({ ...p, service_type: saved }));
  }, []);

  useEffect(() => {
    if (formData.service_type) {
      localStorage.setItem('last_platform', formData.service_type);
    }
  }, [formData.service_type]);

  /* 🔥 auto price calculation */
  useEffect(() => {
    const qty = Number(formData.quantity);
    const rate = BASE_PRICE[formData.order_type];
    if (qty && rate) {
      setFormData(p => ({
        ...p,
        payment_amount: (qty * rate).toFixed(2),
      }));
    }
  }, [formData.quantity, formData.order_type]);

  const set = (k: string, v: any) => {
    setFormData(p => ({ ...p, [k]: v }));
  };

  /* 🔥 validation */
  const validate = () => {
    if (!formData.post_account_link) return "Link required";
    if (!formData.service_type) return "Select platform";
    if (!formData.order_type) return "Select order type";
    if (!formData.quantity) return "Enter quantity";
    if (!formData.payment_amount) return "Enter amount";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errMsg = validate();
    if (errMsg) {
      toast({ title: "Invalid Form", description: errMsg, variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
        payment_amount: Number(formData.payment_amount),
      };

      if (editingOrder) {
        await supabase.from('social_media_orders').update(payload).eq('id', editingOrder.id);
      } else {
        await supabase.from('social_media_orders').insert([payload]);
      }

      /* success animation */
      setSuccessPulse(true);
      setTimeout(() => setSuccessPulse(false), 1000);

      toast({ title: "Success", description: "Order saved successfully" });

      setFormData({
        post_account_link: '',
        service_type: '',
        order_type: '',
        quantity: '',
        payment_amount: '',
        payment_received: false,
      });

      onOrderAdded();
      onCancelEdit?.();

    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlatform = PLATFORMS.find(p => p.value === formData.service_type);

  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">
          {editingOrder ? "Edit Order" : "New Order"}
        </h2>

        {editingOrder && (
          <button onClick={onCancelEdit}>
            <X />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* LINK */}
        <input
          placeholder="Paste link..."
          value={formData.post_account_link}
          onChange={e => set('post_account_link', e.target.value)}
          className="w-full p-3 rounded-lg bg-black/30"
        />

        {/* PLATFORM */}
        <select
          value={formData.service_type}
          onChange={e => set('service_type', e.target.value)}
          className="w-full p-3 rounded-lg bg-black/30"
        >
          <option value="">Select Platform</option>
          {PLATFORMS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        {/* TYPE */}
        <select
          value={formData.order_type}
          onChange={e => set('order_type', e.target.value)}
          className="w-full p-3 rounded-lg bg-black/30"
        >
          <option value="">Order Type</option>
          {ORDER_TYPES.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* QUANTITY */}
        <input
          type="number"
          placeholder="Quantity"
          value={formData.quantity}
          onChange={e => set('quantity', e.target.value)}
          className="w-full p-3 rounded-lg bg-black/30"
        />

        {/* AMOUNT */}
        <input
          type="number"
          placeholder="Amount"
          value={formData.payment_amount}
          onChange={e => set('payment_amount', e.target.value)}
          className="w-full p-3 rounded-lg bg-black/30"
        />

        {/* PAYMENT SWITCH */}
        <div className="flex justify-between items-center">
          <span>Payment Received</span>
          <Switch
            checked={formData.payment_received}
            onCheckedChange={(v) => set('payment_received', v)}
          />
        </div>

        {/* BUTTON */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full h-11 rounded-xl font-bold transition ${
            successPulse ? "bg-green-500" : "bg-indigo-500"
          }`}
        >
          {isLoading
            ? <Loader2 className="animate-spin mx-auto" />
            : editingOrder ? "Update Order" : "Add Order"}
        </button>

      </form>
    </div>
  );
};

export default SocialMediaOrderForm;
