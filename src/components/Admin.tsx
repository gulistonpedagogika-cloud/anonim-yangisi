import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, BarChart2, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { Survey } from '../types';
import { toast } from 'sonner';

export default function Admin() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const navigate = useNavigate();

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const res = await fetch('/api/surveys');
      if (!res.ok) {
        const text = await res.text();
        console.error(`Server error (${res.status}):`, text);
        throw new Error(`Server returned ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setSurveys(data);
      } else {
        console.error('Expected array of surveys, got:', data);
        setSurveys([]);
        toast.error('Ma’lumotlarni yuklashda xatolik');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setSurveys([]);
      toast.error('Server bilan ulanishda xatolik');
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      toast.info('O‘chirish uchun yana bir bor bosing');
      setTimeout(() => setDeleteConfirmId(null), 3000);
      return;
    }
    
    const res = await fetch(`/api/surveys/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('O‘chirildi');
      setDeleteConfirmId(null);
      fetchSurveys();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    navigate('/admin/login');
    toast.success('Tizimdan chiqildi');
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
          <p className="text-slate-500">So‘rovnomalarni boshqarish va natijalarni ko‘rish</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleLogout} className="text-slate-500">
            Chiqish
          </Button>
          <Button onClick={() => navigate('/admin/new')} className="bg-blue-600">
            <Plus className="w-4 h-4 mr-2" /> Yangi so‘rovnoma
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomi</TableHead>
                <TableHead>Kodi</TableHead>
                <TableHead>Savollar</TableHead>
                <TableHead>Yaratilgan</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                    Hozircha so‘rovnomalar yo‘q
                  </TableCell>
                </TableRow>
              ) : (
                surveys.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.title}</TableCell>
                    <TableCell>
                      <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">{s.code}</code>
                    </TableCell>
                    <TableCell>{s.questions.length} ta</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium text-slate-900">
                          {new Date(s.createdAt).toLocaleDateString('uz-UZ')}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(s.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/admin/results/${s.id}`)}>
                        <BarChart2 className="w-4 h-4 mr-1" /> Natijalar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/admin/edit/${s.id}`)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => window.open(`/survey/${s.code}`, '_blank')}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={deleteConfirmId === s.id ? "bg-red-600 text-white hover:bg-red-700" : "text-red-600 hover:text-red-700 hover:bg-red-50"} 
                        onClick={() => handleDelete(s.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        {deleteConfirmId === s.id ? "Tasdiqlash" : ""}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-8">
        <Button variant="ghost" onClick={() => navigate('/')} className="text-slate-500">
          Bosh sahifaga qaytish
        </Button>
      </div>
    </div>
  );
}
