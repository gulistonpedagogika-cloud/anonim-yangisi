import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, Users, FileText, Calendar } from 'lucide-react';
import { Survey, Response } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { surveyService } from '../services/surveyService';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [surveyData, responsesData] = await Promise.all([
          surveyService.getSurveyById(id),
          surveyService.getResponses(id)
        ]);

        if (surveyData) setSurvey(surveyData);
        if (responsesData) setResponses(responsesData);
      } catch (err) {
        console.error('Results fetch error:', err);
        toast.error('Ma’lumotlarni yuklashda xatolik');
      }
    };
    fetchData();
  }, [id]);

  const exportToPDF = async () => {
    if (!resultsRef.current) return;
    setIsExporting(true);
    toast.info('PDF tayyorlanmoqda...');

    try {
      const dataUrl = await toPng(resultsRef.current, {
        quality: 1,
        backgroundColor: '#f8fafc',
        cacheBust: true,
        pixelRatio: 2,
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate how much of the image fits on one page
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add the first page
      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add subsequent pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${survey?.title || 'survey'}-hisobot.pdf`);
      toast.success('PDF yuklab olindi');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('PDF yaratishda xatolik yuz berdi.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!survey) return <div className="p-8">Yuklanmoqda...</div>;

  const getStats = (questionId: string) => {
    const q = survey.questions.find(q => q.id === questionId);
    if (!q) return null;

    const answers = responses.map(r => r.answers.find(a => a.questionId === questionId)?.value).filter(v => v !== undefined);

    if (q.type === 'rating') {
      const data = [1, 2, 3, 4, 5].map(val => ({
        name: `${val} ball`,
        count: answers.filter(v => v === val).length
      }));
      const avg = answers.length > 0 ? (answers.reduce((a, b) => (a as number) + (b as number), 0) as number) / answers.length : 0;
      return { data, avg: avg.toFixed(1) };
    }

    if (q.type === 'single' || q.type === 'multiple') {
      const data = q.options?.map(opt => {
        let count = 0;
        answers.forEach(v => {
          if (Array.isArray(v)) {
            if (v.includes(opt)) count++;
          } else if (v === opt) {
            count++;
          }
        });
        return { name: opt, value: count };
      }) || [];
      return { data };
    }

    return null;
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{survey.title}</h1>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-slate-500 mt-1">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{responses.length} ta ishtirokchi</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Yaratilgan: {new Date(survey.createdAt).toLocaleString('uz-UZ')}</span>
              </div>
            </div>
          </div>
        </div>
        <Button 
          onClick={exportToPDF} 
          disabled={isExporting || responses.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <FileText className="w-4 h-4 mr-2" />
          PDF yuklab olish
        </Button>
      </div>

      <div ref={resultsRef} className="space-y-8 p-8 rounded-xl" style={{ backgroundColor: '#f8fafc' }}>
        {/* PDF Header - Visible for export */}
        <div className="mb-10 text-center border-b pb-6" style={{ borderColor: '#e2e8f0' }}>
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#0f172a' }}>{survey.title}</h2>
          <div className="flex justify-center flex-wrap gap-x-8 gap-y-2 text-sm" style={{ color: '#64748b' }}>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>Ishtirokchilar: <b>{responses.length} ta</b></span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Yaratilgan vaqti: <b>{new Date(survey.createdAt).toLocaleString('uz-UZ')}</b></span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>Hisobot vaqti: <b>{new Date().toLocaleString('uz-UZ')}</b></span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">Ushbu hisobot avtomatik ravishda shakllantirildi</p>
        </div>

        {survey.questions.map((q, idx) => {
          const stats = getStats(q.id);
          if (!stats) return null;

          return (
            <Card key={q.id} className="border-none shadow-sm break-inside-avoid" style={{ backgroundColor: '#ffffff' }}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex gap-3" style={{ color: '#0f172a' }}>
                  <span style={{ color: '#94a3b8' }}>{idx + 1}.</span>
                  {q.text}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  {/* Chart Section */}
                  <div className="h-[300px] w-full min-w-[300px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={300}>
                      {q.type === 'rating' ? (
                        <BarChart data={(stats as any).data}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                          <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
                          <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }} />
                          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      ) : (
                        <PieChart>
                          <Pie
                            data={(stats as any).data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {(stats as any).data.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }} />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </div>

                  {/* Data Summary Section */}
                  <div className="space-y-4">
                    {q.type === 'rating' ? (
                      <div className="p-6 rounded-2xl text-center" style={{ backgroundColor: '#eff6ff' }}>
                        <p className="font-medium mb-1" style={{ color: '#2563eb' }}>O‘rtacha ko‘rsatkich</p>
                        <p className="text-5xl font-black" style={{ color: '#1d4ed8' }}>{(stats as any).avg}</p>
                        <p className="text-sm mt-2" style={{ color: '#3b82f6' }}>5 ballik tizimda</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(stats as any).data.map((item: any, index: number) => {
                          const percentage = responses.length > 0 ? (item.value / responses.length) * 100 : 0;
                          return (
                            <div key={item.name} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium flex items-center gap-2" style={{ color: '#0f172a' }}>
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                  {item.name}
                                </span>
                                <span style={{ color: '#64748b' }}>{item.value} ta ({percentage.toFixed(1)}%)</span>
                              </div>
                              <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#f1f5f9' }}>
                                <div 
                                  className="h-full transition-all duration-500" 
                                  style={{ 
                                    width: `${percentage}%`,
                                    backgroundColor: COLORS[index % COLORS.length]
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
