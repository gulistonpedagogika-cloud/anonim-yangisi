import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Survey } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { surveyService } from '../services/surveyService';

export default function SurveyView() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        if (!code) return;
        const data = await surveyService.getSurveyByCode(code);
        if (!data) {
          toast.error('Sorovnoma topilmadi');
          navigate('/');
          return;
        }
        setSurvey(data);
      } catch (err) {
        console.error('Fetch error:', err);
        toast.error('Server bilan ulanishda xatolik');
        navigate('/');
      }
    };
    fetchSurvey();
  }, [code, navigate]);

  const handleRating = (questionId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSingle = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleMultiple = (questionId: string, option: string, checked: boolean) => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      if (checked) {
        return { ...prev, [questionId]: [...current, option] };
      } else {
        return { ...prev, [questionId]: current.filter((o: string) => o !== option) };
      }
    });
  };

  const handleSubmit = async () => {
    if (!survey) return;

    // Check if all questions are answered
    const unanswered = survey.questions.filter(q => !answers[q.id] || (Array.isArray(answers[q.id]) && answers[q.id].length === 0));
    if (unanswered.length > 0) {
      toast.error('Iltimos, barcha savollarga javob bering');
      return;
    }

    try {
      await surveyService.submitResponse({
        surveyId: survey.id,
        answers: Object.entries(answers).map(([questionId, value]) => ({ 
          questionId, 
          value: value as string | number | string[] 
        }))
      });
      setSubmitted(true);
      toast.success('Javoblaringiz qabul qilindi');
    } catch (err) {
      toast.error('Xatolik yuz berdi');
    }
  };

  if (!survey) return <div className="flex items-center justify-center min-h-screen">Yuklanmoqda...</div>;

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md text-center p-8">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold mb-2">Rahmat!</CardTitle>
          <CardDescription className="text-lg">
            Sizning javoblaringiz anonim tarzda qabul qilindi.
          </CardDescription>
          <Button onClick={() => navigate('/')} className="mt-8">
            Bosh sahifaga qaytish
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{survey.title}</h1>
        <p className="text-slate-500">Iltimos, quyidagi savollarga xolis javob bering.</p>
      </div>

      <div className="space-y-6">
        {survey.questions.map((q, idx) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="border-none shadow-sm overflow-hidden">
              <div className="h-1 bg-blue-600 w-full opacity-20" />
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 text-sm">
                    {idx + 1}
                  </span>
                  {q.text}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {q.type === 'rating' && (
                  <div className="flex justify-between items-center gap-2 max-w-sm mx-auto">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        onClick={() => handleRating(q.id, val)}
                        className={`w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center text-lg font-bold
                          ${answers[q.id] === val 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-110' 
                            : 'border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-600'}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'single' && (
                  <RadioGroup onValueChange={(val) => handleSingle(q.id, val)} className="space-y-3">
                    {q.options?.map((opt) => (
                      <div key={opt} className="flex items-center space-x-3 p-3 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors">
                        <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                        <Label htmlFor={`${q.id}-${opt}`} className="flex-grow cursor-pointer">{opt}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {q.type === 'multiple' && (
                  <div className="space-y-3">
                    {q.options?.map((opt) => (
                      <div key={opt} className="flex items-center space-x-3 p-3 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors">
                        <Checkbox 
                          id={`${q.id}-${opt}`} 
                          onCheckedChange={(checked) => handleMultiple(q.id, opt, !!checked)}
                          checked={(answers[q.id] || []).includes(opt)}
                        />
                        <Label htmlFor={`${q.id}-${opt}`} className="flex-grow cursor-pointer">{opt}</Label>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 flex justify-end">
        <Button onClick={handleSubmit} size="lg" className="px-12 h-14 text-lg bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100">
          Yuborish
        </Button>
      </div>
    </div>
  );
}
