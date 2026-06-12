'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Shield, Plus, Trash2, Edit3, ArrowLeft, Home, Sprout, LandPlot,
  RotateCcw, Eye, EyeOff, Upload, X, Languages, Loader2, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useLang } from '@/lib/LanguageContext';
import { usePropertyStore } from '@/lib/usePropertyStore';
import { LOCATIONS, formatINR } from '@/lib/properties';
import { translateText, translateToAll } from '@/lib/translate';
import { toast } from 'sonner';

function emptyForm() {
  return {
    type: 'agriculture',
    location: 'Nalgonda',
    village: '', villageTe: '', villageHi: '',
    colony: '', colonyTe: '', colonyHi: '',
    titleEn: '', titleTe: '', titleHi: '',
    descEn: '', descTe: '', descHi: '',
    areaAcres: '', pricePerAcre: '',
    areaSqYards: '', pricePerSqYard: '',
    plotArea: '', builtUpArea: '', bedrooms: '',
    totalPrice: '',
    media: [], // array of objects { url, publicId, mediaType, mimeType }
    hotDeal: false,
    sold: false,
  };
}

function recordToForm(p) {
  return {
    type: p.type,
    location: p.location,
    village: p.village || '', villageTe: p.villageTe || '', villageHi: p.villageHi || '',
    colony: p.colony || '', colonyTe: p.colonyTe || '', colonyHi: p.colonyHi || '',
    titleEn: p.title?.en || '', titleTe: p.title?.te || '', titleHi: p.title?.hi || '',
    descEn: p.description?.en || '', descTe: p.description?.te || '', descHi: p.description?.hi || '',
    areaAcres: p.areaAcres || '', pricePerAcre: p.pricePerAcre || '',
    areaSqYards: p.areaSqYards || '', pricePerSqYard: p.pricePerSqYard || '',
    plotArea: p.plotArea || '', builtUpArea: p.builtUpArea || '', bedrooms: p.bedrooms || '',
    totalPrice: p.totalPrice || '',
    media: Array.isArray(p.media)
      ? p.media.map((m) =>
          typeof m === 'string' ? { url: m, publicId: '', mediaType: 'image', mimeType: 'image/jpeg' } : m
        )
      : Array.isArray(p.images)
      ? p.images.map((img) =>
          typeof img === 'string' ? { url: img, publicId: '', mediaType: 'image', mimeType: 'image/jpeg' } : img
        )
      : [],
    hotDeal: !!p.hotDeal,
    sold: !!p.sold,
  };
}

function formToRecord(f) {
  const num = (v) => (v === '' || v == null ? undefined : Number(v));
  const rec = {
    type: f.type,
    location: f.location,
    title: { en: f.titleEn, te: f.titleTe, hi: f.titleHi },
    description: { en: f.descEn, te: f.descTe, hi: f.descHi },
    media: f.media,
    hotDeal: !!f.hotDeal,
    sold: !!f.sold,
  };
  if (f.type === 'agriculture') {
    rec.village = f.village; rec.villageTe = f.villageTe; rec.villageHi = f.villageHi;
    rec.areaAcres = num(f.areaAcres);
    rec.pricePerAcre = num(f.pricePerAcre);
    rec.totalPrice = num(f.totalPrice) || (Number(f.areaAcres || 0) * Number(f.pricePerAcre || 0));
  } else if (f.type === 'plot') {
    rec.colony = f.colony; rec.colonyTe = f.colonyTe; rec.colonyHi = f.colonyHi;
    rec.areaSqYards = num(f.areaSqYards);
    rec.pricePerSqYard = num(f.pricePerSqYard);
    rec.totalPrice = num(f.totalPrice) || (Number(f.areaSqYards || 0) * Number(f.pricePerSqYard || 0));
  } else if (f.type === 'house') {
    rec.colony = f.colony; rec.colonyTe = f.colonyTe; rec.colonyHi = f.colonyHi;
    rec.plotArea = num(f.plotArea);
    rec.builtUpArea = num(f.builtUpArea);
    rec.bedrooms = num(f.bedrooms);
    rec.totalPrice = num(f.totalPrice);
  }
  return rec;
}

function TypeIcon({ type }) {
  if (type === 'agriculture') return <Sprout className="h-4 w-4" />;
  if (type === 'plot') return <LandPlot className="h-4 w-4" />;
  return <Home className="h-4 w-4" />;
}

/* ---------- Reusable: English field that auto-translates to TE+HI on blur ---------- */
function EnglishFieldWithAutoTranslate({
  label, value, onChange, onTranslated, multiline = false, placeholder = '',
}) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [didAuto, setDidAuto] = useState(false);

  const doTranslate = async () => {
    if (!value || !value.trim()) return;
    setBusy(true);
    try {
      const { te, hi } = await translateToAll(value.trim());
      if (te || hi) {
        onTranslated({ te, hi });
        setDidAuto(true);
      } else {
        toast.error('Translation failed — please type manually');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleBlur = () => {
    if (!didAuto) doTranslate();
  };

  const InputEl = multiline ? Textarea : Input;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="text-sm font-semibold text-primary">{label}</Label>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="hidden h-7 w-7 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
          onClick={doTranslate}
          disabled={busy || !value || !value.trim()}
        >
          {busy ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
        </Button>
      </div>
      <InputEl
        value={value}
        onChange={(e) => { setDidAuto(false); onChange(e.target.value); }}
        onBlur={handleBlur}
        placeholder={placeholder}
        rows={multiline ? 4 : undefined}
        className="bg-white"
      />
      {didAuto && (
        <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
          <Languages className="h-3 w-3" /> {t('autoTranslated')}
        </p>
      )}
    </div>
  );
}

/* ---------- Reusable: media upload + thumbnails (images + videos) ---------- */
function MediaUploader({ media, onChange }) {
  const { t } = useLang();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setBusy(true);
    try {
      const fd = new FormData();
      Array.from(fileList).forEach((f) => fd.append('files', f));

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {},
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Upload failed');

      const newMedia = (data.images || []).map((item) => ({
        url: item.url,
        publicId: item.publicId,
        mediaType: item.mediaType || 'image',
        mimeType: item.mimeType,
      }));
      onChange([...(media || []), ...newMedia]);
      toast.success(`${newMedia.length} file(s) uploaded`);
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Upload failed');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeAt = (idx) => {
    const next = media.filter((_, i) => i !== idx);
    onChange(next);
  };

  const srcOf = (m) => (typeof m === 'string' ? m : m?.url);
  const typeOf = (m) => (typeof m === 'string' ? 'image' : (m?.mediaType || 'image'));

  return (
    <div className="space-y-3 bg-muted/40 p-4 rounded-xl border">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Label className="text-base font-semibold">{t('uploadFile') || t('uploadImages')}</Label>
          <p className="text-[12px] text-muted-foreground mt-1">
            {t('imageHint') || 'Upload images and videos. Cloudinary hosting. Max 500 MB each.'}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
          {t('uploadFile') || t('uploadImages')}
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {media && media.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
          {media.map((item, i) => {
            const type = typeOf(item);
            const src = srcOf(item);
            return (
              <div key={i} className="relative group rounded-lg overflow-hidden border bg-white shadow-sm">
                {type === 'video' ? (
                  <video src={src} className="w-full h-28 object-cover bg-black" />
                ) : (
                  <img src={src} alt={`media-${i}`} className="w-full h-28 object-cover" />
                )}
                <div className="absolute top-1 right-1 bg-gray-900/80 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">
                  {type === 'video' ? '▶ VIDEO' : '🖼 IMAGE'}
                </div>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-90 hover:opacity-100 shadow-sm transition-transform hover:scale-110"
                  aria-label={t('removeImage')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ----------------------- MAIN PAGE ----------------------- */
export default function AdminPage() {
  const { t, tField } = useLang();
  const {
    properties, loaded,
    addProperty, updateProperty, deleteProperty, toggleSold, resetAll,
  } = usePropertyStore();

  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/check');

      if (res.ok) {
        setAuthed(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  checkAuth();
}, []);

const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password,
      }),
    });

    if (!res.ok) {
      toast.error(t('wrongPassword'));
      return;
    }

    setAuthed(true);

    try {
      sessionStorage.setItem('admin:auth', '1');
    } catch {}
  } catch (err) {
    toast.error('Login failed');
  }
};

  const openNew = () => { setEditingId(null); setForm(emptyForm()); setOpen(true); };
  const openEdit = (p) => { setEditingId(p.id); setForm(recordToForm(p)); setOpen(true); };

  const submit = async (e) => {
    e.preventDefault();
    const rec = formToRecord(form);
    if (!rec.title.en && !rec.title.te && !rec.title.hi) {
      toast.error('Please add at least one title');
      return;
    }
    try {
      if (editingId) {
        await updateProperty(editingId, rec);
        toast.success('Listing updated');
      } else {
        await addProperty(rec);
        toast.success('Listing added');
      }
      setOpen(false);
    } catch (err) {
      toast.error(err.message || 'Save failed');
    }
  };

  const translateLocality = async (baseValue, isVillage) => {
    if (!baseValue || !baseValue.trim()) return;
    const [te, hi] = await Promise.all([
      translateText(baseValue, 'te'),
      translateText(baseValue, 'hi'),
    ]);
    if (isVillage) {
      setForm((f) => ({ ...f, villageTe: te || f.villageTe, villageHi: hi || f.villageHi }));
    } else {
      setForm((f) => ({ ...f, colonyTe: te || f.colonyTe, colonyHi: hi || f.colonyHi }));
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <Card className="w-full max-w-md p-8 space-y-5 shadow-lg border-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('agentDashboard')}</h1>
              <p className="text-sm text-muted-foreground">Secure Access Portal</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('password')}</Label>
              <div className="relative">
                <Input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="h-12 pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 text-md">
              {t('login')}
            </Button>
          </form>
          <div className="pt-4 border-t text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors">
              <ArrowLeft className="h-4 w-4" /> {t('backToSite')}
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <h1 className="font-bold text-lg hidden sm:block">{t('agentDashboard')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm">
              <Plus className="h-4 w-4 mr-2" /> {t('addListing')}
            </Button>
            <Button variant="outline" onClick={resetAll} className="hidden sm:flex">
              <RotateCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
            <Link href="/">
              <Button variant="ghost"><ArrowLeft className="h-4 w-4 mr-2" /> {t('backToSite')}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5 border-0 shadow-sm">
            <div className="text-sm font-medium text-muted-foreground mb-1">Total Listings</div>
            <div className="text-3xl font-extrabold text-slate-900">{properties.length}</div>
          </Card>
          <Card className="p-5 border-0 shadow-sm">
            <div className="text-sm font-medium text-muted-foreground mb-1">{t('agriculture')}</div>
            <div className="text-3xl font-extrabold text-green-700">{properties.filter(p=>p.type==='agriculture').length}</div>
          </Card>
          <Card className="p-5 border-0 shadow-sm">
            <div className="text-sm font-medium text-muted-foreground mb-1">{t('plot')}</div>
            <div className="text-3xl font-extrabold text-amber-600">{properties.filter(p=>p.type==='plot').length}</div>
          </Card>
          <Card className="p-5 border-0 shadow-sm">
            <div className="text-sm font-medium text-muted-foreground mb-1">{t('house')}</div>
            <div className="text-3xl font-extrabold text-blue-700">{properties.filter(p=>p.type==='house').length}</div>
          </Card>
        </div>

        {/* Listings Table */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100/80 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-600">{t('type')}</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Title</th>
                  <th className="text-left p-4 font-semibold text-slate-600">{t('locationLabel')}</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Area</th>
                  <th className="text-left p-4 font-semibold text-slate-600">{t('totalCost')}</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Status</th>
                  <th className="text-right p-4 font-semibold text-slate-600">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {properties.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <Badge variant="secondary" className="gap-1.5 font-medium">
                        <TypeIcon type={p.type} />{t(p.type)}
                      </Badge>
                    </td>
                    <td className="p-4 max-w-[280px] truncate font-medium">{tField(p.title) || '—'}</td>
                    <td className="p-4 text-muted-foreground">{p.type === 'agriculture' ? p.village : p.colony}, {p.location}</td>
                    <td className="p-4 text-muted-foreground">
                      {p.type === 'agriculture' && `${p.areaAcres} acres`}
                      {p.type === 'plot' && `${p.areaSqYards} sq.yd`}
                      {p.type === 'house' && `${p.builtUpArea} sqft / ${p.bedrooms} BHK`}
                    </td>
                    <td className="p-4 font-bold text-slate-700">{formatINR(p.totalPrice)}</td>
                    <td className="p-4 space-y-1">
                      {p.hotDeal && <Badge className="bg-orange-500 hover:bg-orange-600 border-0 shadow-sm block w-fit mb-1">Hot Deal</Badge>}
                      {p.sold ? <Badge variant="destructive" className="shadow-sm">Sold</Badge> : <Badge variant="outline" className="bg-white">Active</Badge>}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="h-8 bg-white" onClick={async () => {
                          try { await toggleSold(p.id); }
                          catch (err) { toast.error(err.message); }
                        }} title={t('toggleSold')}>
                          {p.sold ? 'Mark Active' : 'Mark Sold'}
                        </Button>
                        <Button size="icon" variant="outline" className="h-8 w-8 bg-white text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => openEdit(p)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="outline" className="h-8 w-8 bg-white text-red-600 hover:text-red-700 hover:bg-red-50" onClick={async () => {
                          if (confirm('Are you sure you want to delete this listing?')) {
                            try { await deleteProperty(p.id); toast.success('Deleted'); }
                            catch (err) { toast.error(err.message); }
                          }
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {properties.length === 0 && (
                  <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">No listings found. Create one to get started.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {/* Structured Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col overflow-hidden bg-slate-50">
          <DialogHeader className="p-6 pb-4 bg-white border-b sticky top-0 z-10 shadow-sm">
            <DialogTitle className="text-xl flex items-center gap-2">
              {editingId ? <Edit3 className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
              {editingId ? t('editListing') : t('addListing')}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <form onSubmit={submit} className="space-y-8">
              
              {/* --- Section 1: Basic Classification --- */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase border-b pb-2">1. Classification</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="font-semibold">{t('type')}</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-xl z-[9999]">
                        <SelectItem value="agriculture">{t('agriculture')}</SelectItem>
                        <SelectItem value="plot">{t('plot')}</SelectItem>
                        <SelectItem value="house">{t('house')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">{t('locationLabel')}</Label>
                    <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
                      <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-xl z-[9999]">
                        {LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* --- Section 2: Locality Details --- */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase border-b pb-2">2. Locality Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label className="font-semibold text-primary">{form.type === 'agriculture' ? t('village') : t('colony')} (EN)</Label>
                      <Button
                        type="button" size="icon" variant="secondary" className="hidden h-7 w-7 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        onClick={() => translateLocality(form.type === 'agriculture' ? form.village : form.colony, form.type === 'agriculture')}
                        disabled={form.type === 'agriculture' ? !form.village : !form.colony}
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      className="bg-white"
                      value={form.type === 'agriculture' ? form.village : form.colony}
                      onChange={(e) => setForm(form.type === 'agriculture' ? { ...form, village: e.target.value } : { ...form, colony: e.target.value })}
                      onBlur={() => {
                        const val = form.type === 'agriculture' ? form.village : form.colony;
                        const hasTe = form.type === 'agriculture' ? form.villageTe : form.colonyTe;
                        const hasHi = form.type === 'agriculture' ? form.villageHi : form.colonyHi;
                        if (val && !hasTe && !hasHi) translateLocality(val, form.type === 'agriculture');
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">{form.type === 'agriculture' ? t('village') : t('colony')} (TE)</Label>
                    <Input className="bg-white" value={form.type === 'agriculture' ? form.villageTe : form.colonyTe} onChange={(e) => setForm(form.type === 'agriculture' ? { ...form, villageTe: e.target.value } : { ...form, colonyTe: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">{form.type === 'agriculture' ? t('village') : t('colony')} (HI)</Label>
                    <Input className="bg-white" value={form.type === 'agriculture' ? form.villageHi : form.colonyHi} onChange={(e) => setForm(form.type === 'agriculture' ? { ...form, villageHi: e.target.value } : { ...form, colonyHi: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* --- Section 3: Content (Title & Description) --- */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase border-b pb-2">3. Property Description</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <EnglishFieldWithAutoTranslate
                    label={`${t('titleEn')} (Primary)`}
                    value={form.titleEn}
                    onChange={(v) => setForm((f) => ({ ...f, titleEn: v }))}
                    onTranslated={({ te, hi }) => setForm((f) => ({ ...f, titleTe: te || f.titleTe, titleHi: hi || f.titleHi }))}
                  />
                  <div className="space-y-2">
                    <Label className="font-semibold">{t('titleTe')}</Label>
                    <Input className="bg-white" value={form.titleTe} onChange={(e) => setForm({ ...form, titleTe: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">{t('titleHi')}</Label>
                    <Input className="bg-white" value={form.titleHi} onChange={(e) => setForm({ ...form, titleHi: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <EnglishFieldWithAutoTranslate
                    label={`${t('descEn')} (Primary)`}
                    value={form.descEn}
                    multiline
                    onChange={(v) => setForm((f) => ({ ...f, descEn: v }))}
                    onTranslated={({ te, hi }) => setForm((f) => ({ ...f, descTe: te || f.descTe, descHi: hi || f.descHi }))}
                  />
                  <div className="space-y-2">
                    <Label className="font-semibold">{t('descTe')}</Label>
                    <Textarea className="bg-white" rows={4} value={form.descTe} onChange={(e) => setForm({ ...form, descTe: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">{t('descHi')}</Label>
                    <Textarea className="bg-white" rows={4} value={form.descHi} onChange={(e) => setForm({ ...form, descHi: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* --- Section 4: Specifications & Pricing --- */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase border-b pb-2">4. Size & Pricing</h3>
                {form.type === 'agriculture' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="space-y-2"><Label className="font-semibold">{t('totalArea')} ({t('acres')})</Label>
                      <Input className="bg-white" type="number" value={form.areaAcres} onChange={(e) => setForm({ ...form, areaAcres: e.target.value })} />
                    </div>
                    <div className="space-y-2"><Label className="font-semibold">{t('costPerAcre')}</Label>
                      <Input className="bg-white" type="number" value={form.pricePerAcre} onChange={(e) => setForm({ ...form, pricePerAcre: e.target.value })} />
                    </div>
                    <div className="space-y-2"><Label className="font-semibold text-primary">{t('totalCost')}</Label>
                      <Input className="bg-emerald-50/50 border-emerald-200 font-bold" type="number" value={form.totalPrice} onChange={(e) => setForm({ ...form, totalPrice: e.target.value })}
                        placeholder={String((Number(form.areaAcres || 0) * Number(form.pricePerAcre || 0)) || '')} />
                    </div>
                  </div>
                )}
                {form.type === 'plot' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="space-y-2"><Label className="font-semibold">{t('totalArea')} ({t('sqYards')})</Label>
                      <Input className="bg-white" type="number" value={form.areaSqYards} onChange={(e) => setForm({ ...form, areaSqYards: e.target.value })} />
                    </div>
                    <div className="space-y-2"><Label className="font-semibold">{t('costPerSqYard')}</Label>
                      <Input className="bg-white" type="number" value={form.pricePerSqYard} onChange={(e) => setForm({ ...form, pricePerSqYard: e.target.value })} />
                    </div>
                    <div className="space-y-2"><Label className="font-semibold text-primary">{t('totalCost')}</Label>
                      <Input className="bg-emerald-50/50 border-emerald-200 font-bold" type="number" value={form.totalPrice} onChange={(e) => setForm({ ...form, totalPrice: e.target.value })}
                        placeholder={String((Number(form.areaSqYards || 0) * Number(form.pricePerSqYard || 0)) || '')} />
                    </div>
                  </div>
                )}
                {form.type === 'house' && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="space-y-2"><Label className="font-semibold">{t('plotArea')} ({t('sqYards')})</Label>
                      <Input className="bg-white" type="number" value={form.plotArea} onChange={(e) => setForm({ ...form, plotArea: e.target.value })} />
                    </div>
                    <div className="space-y-2"><Label className="font-semibold">{t('builtUpArea')} ({t('sqft')})</Label>
                      <Input className="bg-white" type="number" value={form.builtUpArea} onChange={(e) => setForm({ ...form, builtUpArea: e.target.value })} />
                    </div>
                    <div className="space-y-2"><Label className="font-semibold">{t('bedrooms')}</Label>
                      <Input className="bg-white" type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} />
                    </div>
                    <div className="space-y-2"><Label className="font-semibold text-primary">{t('totalCost')}</Label>
                      <Input className="bg-emerald-50/50 border-emerald-200 font-bold" type="number" value={form.totalPrice} onChange={(e) => setForm({ ...form, totalPrice: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>

              {/* --- Section 5: Media & Visibility --- */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase border-b pb-2">5. Media & Status</h3>
                
                <MediaUploader media={form.media || []} onChange={(m) => setForm((f) => ({ ...f, media: m }))} />

                <div className="flex flex-wrap items-center gap-8 bg-white p-5 rounded-xl border">
                  <div className="flex items-center gap-3">
                    <Switch checked={form.hotDeal} onCheckedChange={(v) => setForm({ ...form, hotDeal: v })} id="hot" className="data-[state=checked]:bg-orange-500" />
                    <Label htmlFor="hot" className="font-semibold cursor-pointer">Mark as Hot Deal 🔥</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={form.sold} onCheckedChange={(v) => setForm({ ...form, sold: v })} id="sold" className="data-[state=checked]:bg-red-600" />
                    <Label htmlFor="sold" className="font-semibold cursor-pointer">Mark as Sold</Label>
                  </div>
                </div>
              </div>

            </form>
          </div>

          <DialogFooter className="p-4 bg-white border-t sm:justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="w-full sm:w-auto">{t('cancel')}</Button>
            <Button onClick={submit} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
              {editingId ? 'Save Changes' : 'Publish Listing'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
