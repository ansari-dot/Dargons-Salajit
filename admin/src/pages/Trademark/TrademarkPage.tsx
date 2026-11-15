import React, { useEffect, useState } from 'react';
import { ExternalLink, FileText, ImagePlus, Pencil, Plus, RefreshCw, Shield, Trash2, X } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useToast } from '../../components/common/Toast';
import { Trademark, TrademarkPayload, trademarksApi } from '../../services/trademarks.api';
import { uploadSingleImageFile } from '../../services/uploadService';

const emptyForm: TrademarkPayload = {
  title: '',
  subtitle: '',
  image_url: '',
  document_url: '',
  display_order: 0,
  is_active: true,
};

export const TrademarkPage: React.FC = () => {
  const [items, setItems] = useState<Trademark[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Trademark | null>(null);
  const [form, setForm] = useState<TrademarkPayload>(emptyForm);
  const toast = useToast();

  const loadItems = async () => {
    setLoading(true);
    try {
      setItems(await trademarksApi.getAll());
    } catch (error) {
      console.error('Failed to load trademarks:', error);
      toast.error('Unable to load trademarks. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, display_order: items.length });
    setModalOpen(true);
  };

  const openEdit = (item: Trademark) => {
    setEditing(item);
    setForm({
      title: item.title,
      subtitle: item.subtitle || '',
      image_url: item.image_url || '',
      document_url: item.document_url || '',
      display_order: item.display_order,
      is_active: Boolean(item.is_active),
    });
    setModalOpen(true);
  };

  const updateForm = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target;
    const nextValue = type === 'checkbox' ? (event.target as HTMLInputElement).checked : value;
    setForm((current) => ({ ...current, [name]: nextValue }));
  };

  const uploadTrademarkImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image files must be 10 MB or smaller.');
      return;
    }

    setUploadingImage(true);
    try {
      const imageUrl = await uploadSingleImageFile(file);
      setForm((current) => ({ ...current, image_url: imageUrl }));
      toast.success('Trademark image uploaded.');
    } catch (error) {
      console.error('Failed to upload trademark image:', error);
      toast.error('Unable to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error('Enter a trademark title.');
      return;
    }

    setSaving(true);
    const payload: TrademarkPayload = {
      ...form,
      title: form.title.trim(),
      subtitle: form.subtitle?.trim() || null,
      image_url: form.image_url?.trim() || null,
      document_url: form.document_url?.trim() || null,
      display_order: Number(form.display_order) || 0,
    };

    try {
      if (editing) {
        await trademarksApi.update(editing.id, payload);
        toast.success('Trademark document updated.');
      } else {
        await trademarksApi.create(payload);
        toast.success('Trademark document created.');
      }
      setModalOpen(false);
      await loadItems();
    } catch (error) {
      console.error('Failed to save trademark:', error);
      toast.error('Unable to save trademark document. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: Trademark) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await trademarksApi.remove(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      toast.success('Trademark document deleted.');
    } catch (error) {
      console.error('Failed to delete trademark:', error);
      toast.error('Unable to delete trademark document. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trademark Documents</h1>
          <p className="mt-1 text-sm text-slate-500">Manage trademark certificates displayed on your storefront.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={() => void loadItems()}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
            Add trademark
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">Loading trademarks...</p>
        ) : items.length === 0 ? (
          <div className="p-10 text-center">
            <Shield className="mx-auto mb-3 h-9 w-9 text-slate-300" />
            <p className="font-semibold text-slate-700">No trademark documents yet</p>
            <p className="mt-1 text-sm text-slate-500">Add a trademark document to display it on the storefront.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Trademark</th>
                  <th className="px-5 py-3">Document URL</th>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="text-slate-700">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="h-12 w-16 rounded-lg border border-slate-200 object-cover" />
                        ) : (
                          <span className="grid h-12 w-16 place-items-center rounded-lg bg-slate-100 text-slate-400">
                            <Shield className="h-5 w-5" />
                          </span>
                        )}
                        <div>
                          <p className="font-semibold text-slate-900">{item.title}</p>
                          {item.subtitle && <p className="mt-1 text-xs text-slate-500">{item.subtitle}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {item.document_url ? (
                        <a href={item.document_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-[180px] block">
                          {item.document_url}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-4">{item.display_order}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {item.is_active ? 'Published' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {item.document_url && (
                          <a className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" href={item.document_url} target="_blank" rel="noreferrer" aria-label={`View ${item.title}`}>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => openEdit(item)} aria-label={`Edit ${item.title}`}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" onClick={() => void remove(item)} aria-label={`Delete ${item.title}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="presentation">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl" role="dialog" aria-modal="true" aria-labelledby="trademark-form-title">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 id="trademark-form-title" className="text-lg font-bold text-slate-900">{editing ? 'Edit trademark document' : 'Add trademark document'}</h2>
              <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setModalOpen(false)} aria-label="Close dialog">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={save} className="space-y-4 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">Title *
                  <input required name="title" value={form.title} onChange={updateForm} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 font-normal" />
                </label>
                <label className="text-sm font-medium text-slate-700">Subtitle
                  <input name="subtitle" value={form.subtitle || ''} onChange={updateForm} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 font-normal" />
                </label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">Document URL
                  <span className="relative mt-1.5 block">
                    <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input type="url" name="document_url" value={form.document_url || ''} onChange={updateForm} className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 font-normal" placeholder="https://..." />
                  </span>
                </label>
                <label className="text-sm font-medium text-slate-700">Display order
                  <input type="number" min="0" name="display_order" value={form.display_order} onChange={updateForm} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 font-normal" />
                </label>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-700">Trademark image</span>
                <div className="mt-1.5 flex flex-col gap-4 rounded-xl border border-dashed border-slate-300 p-4 sm:flex-row sm:items-center">
                  {form.image_url ? (
                    <img src={form.image_url} alt="Trademark preview" className="h-32 w-full rounded-lg bg-slate-50 object-contain sm:w-48" />
                  ) : (
                    <div className="grid h-32 w-full place-items-center rounded-lg bg-slate-50 text-slate-300 sm:w-48">
                      <ImagePlus className="h-8 w-8" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      <ImagePlus className="h-4 w-4" />
                      {uploadingImage ? 'Uploading image...' : form.image_url ? 'Replace image' : 'Upload image'}
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={uploadTrademarkImage} disabled={uploadingImage} />
                    </label>
                    {form.image_url && (
                      <button type="button" className="ml-3 text-sm text-rose-600 hover:text-rose-700" onClick={() => setForm((current) => ({ ...current, image_url: '' }))}>
                        Remove image
                      </button>
                    )}
                    <p className="text-xs text-slate-500">JPG, PNG, WEBP or GIF. Maximum 10 MB.</p>
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="is_active" checked={Boolean(form.is_active)} onChange={updateForm} className="h-4 w-4 rounded border-slate-300" />
                Published on storefront
              </label>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving || uploadingImage}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Create trademark document'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
