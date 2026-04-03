




import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

/* ── platform & order meta ── */
const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', Icon: Instagram, gradient: 'from-pink-600 to-orange-500', glow: 'rgba(236,72,153,0.3)' },
  { value: 'youtube',   label: 'YouTube',   Icon: Youtube,   gradient: 'from-red-600 to-rose-500',    glow: 'rgba(239,68,68,0.3)' },
  { value: 'facebook',  label: 'Facebook',  Icon: Facebook,  gradient: 'from-blue-600 to-blue-500',   glow: 'rgba(59,130,246,0.3)' },
  { value: 'telegram',  label: 'Telegram',  Icon: Send,      gradient: 'from-sky-600 to-cyan-500',    glow: 'rgba(14,165,233,0.3)' },
  { value: 'twitter',   label: 'Twitter/X', Icon: Twitter,   gradient: 'from-slate-600 to-slate-400', glow: 'rgba(148,163,184,0.3)' },
];

const ORDER_TYPES = [
  { value: 'likes',     label: 'Likes',     Icon: Heart,         color: 'text-rose-400' },
  { value: 'followers', label: 'Followers', Icon: Users,         color: 'text-sky-400' },
  { value: 'comments',  label: 'Comments',  Icon: MessageCircle, color: 'text-amber-400' },
  { value: 'views',     label: 'Views',     Icon: Eye,           color: 'text-violet-400' },
];

/* ── reusable styled field wrapper ── */
const Field: React.FC<{ label: string; htmlFor: string; children: React.ReactNode; full?: boolean }> = ({ label, htmlFor, children, full }) => (
  <div className={full ? 'col-span-2' : ''}>
    <label htmlFor={htmlFor} className="block text-[11px] font-bold uppercase tracking-[0.1em] text-gray-500 mb-2">
      {label}
    </label>
    {children}
  </div>
);

/* ── custom select ── */
interface CustomSelectProps<T extends { value: string; label: string }> {
  id: string;
  options: T[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  renderOption: (o: T, selected: boolean) => React.ReactNode;
  renderSelected: (o: T) => React.ReactNode;
}

function CustomSelect<T extends { value: string; label: string }>({
  id, options, value, onChange, placeholder, renderOption, renderSelected
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <div className="relative" id={id}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="w-full h-11 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-between text-left transition-all hover:border-white/20 hover:bg-white/[0.05] focus:outline-none focus:border-indigo-500/50"
        style={{ boxShadow: open ? '0 0 0 3px rgba(99,102,241,0.15)' : undefined }}
      >
        <span className={selected ? 'text-white' : 'text-gray-600 text-[13px]'}>
          {selected ? renderSelected(selected) : placeholder}
        </span>
        <ChevronDown
          className="w-4 h-4 text-gray-600 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
        />
      </button>

      {open && (
        <div
          className="absolute z-50 left-0 right-0 mt-2 rounded-2xl border border-white/[0.08] overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #111118, #0d0d14)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.05] transition-colors border-b border-white/[0.04] last:border-b-0 text-left"
            >
              {renderOption(opt, opt.value === value)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── styled text input ── */
const StyledInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { prefix?: React.ReactNode }> = ({ prefix, className, ...props }) => (
  <div className="relative">
    {prefix && (
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">{prefix}</div>
    )}
    <input
      {...props}
      className={`
        w-full h-11 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-[14px]
        placeholder:text-gray-700 transition-all
        hover:border-white/20 hover:bg-white/[0.05]
        focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.04]
        focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]
        ${prefix ? 'pl-10' : 'px-3.5'}
        ${className || ''}
      `}
    />
  </div>
);

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
const SocialMediaOrderForm: React.FC<SocialMediaOrderFormProps> = ({ onOrderAdded, editingOrder, onCancelEdit }) => {
  const [formData, setFormData] = useState({
    post_account_link: editingOrder?.post_account_link || '',
    service_type:      editingOrder?.service_type      || '',
    order_type:        editingOrder?.order_type        || '',
    quantity:          editingOrder?.quantity          || '',
    payment_amount:    editingOrder?.payment_amount    || '',
    payment_received:  editingOrder?.payment_received  || false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted]     = useState(false);
  const { toast } = useToast();

  useEffect(() => { const t = requestAnimationFrame(() => setMounted(true)); return () => cancelAnimationFrame(t); }, []);

  const set = (key: string, value: any) => setFormData(p => ({ ...p, [key]: value }));

  const selectedPlatform = PLATFORMS.find(p => p.value === formData.service_type);
  const selectedOrderType = ORDER_TYPES.find(o => o.value === formData.order_type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        quantity:       parseInt(String(formData.quantity)),
        payment_amount: parseFloat(String(formData.payment_amount)),
      };

      if (editingOrder) {
        const { error } = await supabase.from('social_media_orders').update(payload).eq('id', editingOrder.id);
        if (error) throw error;
        toast({ title: 'Order Updated', description: 'Changes saved successfully.' });
      } else {
        const { error } = await supabase.from('social_media_orders').insert([payload]);
        if (error) throw error;
        toast({ title: 'Order Added', description: 'New order created successfully.' });
      }

      setFormData({ post_account_link: '', service_type: '', order_type: '', quantity: '', payment_amount: '', payment_received: false });
      onOrderAdded();
      onCancelEdit?.();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save order.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative rounded-2xl border border-white/[0.07] overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.01) 100%)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        opacity:   mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      {/* Accent shimmer top bar */}
      <div
        className="h-[1.5px] w-full"
        style={{
          background: selectedPlatform
            ? `linear-gradient(90deg, transparent, ${selectedPlatform.glow.replace('0.3', '0.8')}, transparent)`
            : 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)',
          transition: 'background 0.5s ease',
        }}
      />

      {/* Ambient glow from selected platform */}
      {selectedPlatform && (
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-40 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${selectedPlatform.glow} 0%, transparent 70%)`,
            filter: 'blur(40px)',
            transition: 'background 0.6s ease',
          }}
        />
      )}

      {/* ── HEADER ── */}
      <div className="relative px-5 sm:px-6 pt-5 pb-4 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${selectedPlatform?.gradient || 'from-indigo-600 to-violet-500'} transition-all duration-500`}
            style={{ boxShadow: `0 4px 16px ${selectedPlatform?.glow || 'rgba(99,102,241,0.35)'}` }}
          >
            {editingOrder
              ? <Pencil className="w-4.5 h-4.5 text-white" />
              : selectedPlatform
                ? <selectedPlatform.Icon className="w-4.5 h-4.5 text-white" />
                : <ShoppingBag className="w-4.5 h-4.5 text-white" />
            }
          </div>
          <div>
            <h2 className="text-[15px] font-black text-white tracking-tight">
              {editingOrder ? 'Edit Order' : 'New Social Order'}
            </h2>
            <p className="text-[11px] text-gray-600 mt-0.5">
              {selectedPlatform
                ? `${selectedPlatform.label}${selectedOrderType ? ` · ${selectedOrderType.label}` : ''}`
                : 'Fill in the order details below'}
            </p>
          </div>
        </div>
        {editingOrder && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>

      {/* ── FORM BODY ── */}
      <form onSubmit={handleSubmit} className="relative p-5 sm:p-6 space-y-5">

        {/* Link */}
        <Field label="Post / Account Link" htmlFor="link" full>
          <StyledInput
            id="link"
            type="url"
            placeholder="https://instagram.com/p/..."
            value={formData.post_account_link}
            onChange={e => set('post_account_link', e.target.value)}
            required
            prefix={<Link2 className="w-4 h-4" />}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Platform */}
          <Field label="Platform" htmlFor="platform">
            <CustomSelect
              id="platform"
              options={PLATFORMS}
              value={formData.service_type}
              onChange={v => set('service_type', v)}
              placeholder="Select platform"
              renderSelected={opt => (
                <span className="flex items-center gap-2">
                  <opt.Icon className="w-4 h-4 text-white" />
                  <span className="text-[13px] font-medium">{opt.label}</span>
                </span>
              )}
              renderOption={(opt, active) => (
                <>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${opt.gradient}`}>
                    <opt.Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className={`text-[13px] font-medium flex-1 ${active ? 'text-white' : 'text-gray-300'}`}>{opt.label}</span>
                  {active && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                </>
              )}
            />
          </Field>

          {/* Order Type */}
          <Field label="Order Type" htmlFor="order_type">
            <CustomSelect
              id="order_type"
              options={ORDER_TYPES}
              value={formData.order_type}
              onChange={v => set('order_type', v)}
              placeholder="Select type"
              renderSelected={opt => (
                <span className="flex items-center gap-2">
                  <opt.Icon className={`w-4 h-4 ${opt.color}`} />
                  <span className="text-[13px] font-medium">{opt.label}</span>
                </span>
              )}
              renderOption={(opt, active) => (
                <>
                  <opt.Icon className={`w-4 h-4 ${opt.color}`} />
                  <span className={`text-[13px] font-medium flex-1 ${active ? 'text-white' : 'text-gray-300'}`}>{opt.label}</span>
                  {active && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                </>
              )}
            />
          </Field>

          {/* Quantity */}
          <Field label="Quantity" htmlFor="quantity">
            <StyledInput
              id="quantity"
              type="number"
              min="1"
              placeholder="e.g. 1000"
              value={formData.quantity}
              onChange={e => set('quantity', e.target.value)}
              required
              prefix={<Hash className="w-4 h-4" />}
            />
          </Field>

          {/* Payment Amount */}
          <Field label="Payment Amount" htmlFor="payment">
            <StyledInput
              id="payment"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.payment_amount}
              onChange={e => set('payment_amount', e.target.value)}
              required
              prefix={<IndianRupee className="w-4 h-4" />}
            />
          </Field>

        </div>

        {/* Payment received toggle */}
        <div
          className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-white/[0.06] transition-colors"
          style={{ background: formData.payment_received ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)', borderColor: formData.payment_received ? 'rgba(16,185,129,0.2)' : undefined }}
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${formData.payment_received ? 'bg-emerald-500/20' : 'bg-white/[0.04]'}`}>
              <CheckCircle2 className={`w-4.5 h-4.5 transition-colors ${formData.payment_received ? 'text-emerald-400' : 'text-gray-600'}`} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white">Payment Received</p>
              <p className="text-[11px] text-gray-600">Mark if payment has been collected</p>
            </div>
          </div>
          <Switch
            id="payment_received"
            checked={formData.payment_received}
            onCheckedChange={v => set('payment_received', v)}
            className="data-[state=checked]:bg-emerald-500"
          />
        </div>

        {/* ── DIVIDER ── */}
        <div className="h-px bg-white/[0.05] rounded-full" />

        {/* ── ACTIONS ── */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 h-11 rounded-xl font-bold text-[13px] text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: selectedPlatform
                ? `linear-gradient(135deg, ${selectedPlatform.glow.replace('0.3','1')}, ${selectedPlatform.glow.replace('0.3','0.6')})`
                : 'linear-gradient(135deg, #6366f1, #4f46e5)',
              boxShadow: `0 4px 20px ${selectedPlatform?.glow || 'rgba(99,102,241,0.4)'}`,
              transition: 'background 0.5s ease, box-shadow 0.5s ease',
            }}
          >
            {isLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : editingOrder
                ? <><Pencil className="w-4 h-4" /> Update Order</>
                : <><Plus className="w-4 h-4" /> Add Order</>
            }
          </button>

          {editingOrder && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="h-11 px-5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-gray-400 text-[13px] font-semibold hover:bg-white/[0.07] hover:text-white hover:border-white/20 transition-all active:scale-[0.97]"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SocialMediaOrderForm;
