import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { surveyService } from '../services/surveyService';

export default function Home() {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      const survey = await surveyService.getSurveyByCode(code);
      if (survey) {
        navigate(`/survey/${code}`);
      } else {
        toast.error('Sorovnoma kodi noto‘g‘ri');
      }
    } catch (err) {
      toast.error('Xatolik yuz berdi');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md border-none shadow-2xl bg-white/80 backdrop-blur-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
            <span className="text-white text-2xl font-bold">GDPI</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Guliston davlat pedagogika instituti
          </CardTitle>
          <CardDescription className="text-slate-500">
            Anonim so‘rovnomada ishtirok etish uchun kodni kiriting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Sorovnoma kodi (masalan: GDPI-2026)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-12 text-center text-lg font-mono tracking-widest uppercase"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 transition-all">
              Ishtirok etish
            </Button>
          </form>
          <div className="mt-8 text-center">
            <Button variant="link" onClick={() => navigate('/admin')} className="text-slate-400 hover:text-blue-600 transition-colors">
              Admin panel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
