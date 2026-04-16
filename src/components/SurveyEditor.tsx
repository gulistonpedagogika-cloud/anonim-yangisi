import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Question, QuestionType } from '../types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { surveyService } from '../services/surveyService';

export default function SurveyEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (id) {
      surveyService.getSurveyById(id).then(s => {
        if (s) {
          setTitle(s.title);
          setCode(s.code);
          setQuestions(s.questions);
        }
      });
    }
  }, [id]);

  const addQuestion = () => {
    setQuestions([...questions, { id: uuidv4(), text: '', type: 'rating' }]);
  };

  const removeQuestion = (qId: string) => {
    setQuestions(questions.filter(q => q.id !== qId));
  };

  const updateQuestion = (qId: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, ...updates } : q));
  };

  const addOption = (qId: string) => {
    const q = questions.find(q => q.id === qId);
    if (!q) return;
    const options = q.options || [];
    updateQuestion(qId, { options: [...options, ''] });
  };

  const updateOption = (qId: string, idx: number, val: string) => {
    const q = questions.find(q => q.id === qId);
    if (!q) return;
    const options = [...(q.options || [])];
    options[idx] = val;
    updateQuestion(qId, { options });
  };

  const removeOption = (qId: string, idx: number) => {
    const q = questions.find(q => q.id === qId);
    if (!q) return;
    const options = (q.options || []).filter((_, i) => i !== idx);
    updateQuestion(qId, { options });
  };

  const handleSave = async () => {
    if (!title || !code || questions.length === 0) {
      toast.error('Iltimos, barcha maydonlarni to‘ldiring');
      return;
    }

    try {
      if (id) {
        await surveyService.updateSurvey(id, { title, code, questions });
      } else {
        await surveyService.createSurvey({ title, code, questions });
      }
      toast.success('Saqlandi');
      navigate('/admin');
    } catch (err) {
      toast.error('Xatolik yuz berdi');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold text-slate-900">
          {id ? 'So‘rovnomani tahrirlash' : 'Yangi so‘rovnoma'}
        </h1>
      </div>

      <div className="space-y-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Asosiy ma‘lumotlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>So‘rovnoma nomi</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Masalan: Talabalar qoniqish darajasi" />
            </div>
            <div className="space-y-2">
              <Label>Kirish kodi</Label>
              <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Masalan: GDPI-2026" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Savollar</h2>
            <Button onClick={addQuestion} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Savol qo‘shish
            </Button>
          </div>

          {questions.map((q, idx) => (
            <Card key={q.id} className="border-none shadow-sm relative group">
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-grow space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-500 text-xs uppercase tracking-wider">Savol {idx + 1}</Label>
                      <Input value={q.text} onChange={e => updateQuestion(q.id, { text: e.target.value })} placeholder="Savol matnini kiriting..." />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-500 text-xs uppercase tracking-wider">Turi</Label>
                      <RadioGroup 
                        value={q.type} 
                        onValueChange={(val) => updateQuestion(q.id, { type: val as QuestionType, options: val === 'rating' ? undefined : (q.options || ['']) })}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="rating" id={`rating-${q.id}`} />
                          <Label htmlFor={`rating-${q.id}`}>5 ballik</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="single" id={`single-${q.id}`} />
                          <Label htmlFor={`single-${q.id}`}>Bitta tanlov</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="multiple" id={`multiple-${q.id}`} />
                          <Label htmlFor={`multiple-${q.id}`}>Bir nechta tanlov</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {(q.type === 'single' || q.type === 'multiple') && (
                      <div className="space-y-3 pl-4 border-l-2 border-slate-100">
                        <Label className="text-slate-500 text-xs uppercase tracking-wider">Variantlar</Label>
                        {q.options?.map((opt, oIdx) => (
                          <div key={oIdx} className="flex gap-2">
                            <Input value={opt} onChange={e => updateOption(q.id, oIdx, e.target.value)} placeholder={`Variant ${oIdx + 1}`} />
                            <Button variant="ghost" size="icon" onClick={() => removeOption(q.id, oIdx)} disabled={q.options!.length <= 1}>
                              <Trash2 className="w-4 h-4 text-slate-400" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" onClick={() => addOption(q.id)} className="text-blue-600">
                          <Plus className="w-4 h-4 mr-1" /> Variant qo‘shish
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 self-start" onClick={() => removeQuestion(q.id)}>
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="pt-8 flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate('/admin')}>Bekor qilish</Button>
          <Button onClick={handleSave} className="bg-blue-600 px-8">Saqlash</Button>
        </div>
      </div>
    </div>
  );
}
