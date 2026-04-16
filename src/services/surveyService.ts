import { supabase } from '../lib/supabase';
import { Survey, Response } from '../types';

export const surveyService = {
  async getSurveys() {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(s => ({
      ...s,
      questions: s.questions, // Supabase handles JSONB
      createdAt: s.created_at
    })) as Survey[];
  },

  async getSurveyByCode(code: string) {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();
    
    if (error) return null;
    return {
      ...data,
      questions: data.questions,
      createdAt: data.created_at
    } as Survey;
  },

  async getSurveyById(id: string) {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return {
      ...data,
      questions: data.questions,
      createdAt: data.created_at
    } as Survey;
  },

  async createSurvey(survey: Omit<Survey, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from('surveys')
      .insert([{
        title: survey.title,
        code: survey.code.toUpperCase(),
        questions: survey.questions,
        created_at: Date.now()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateSurvey(id: string, survey: Partial<Survey>) {
    const { data, error } = await supabase
      .from('surveys')
      .update({
        title: survey.title,
        code: survey.code?.toUpperCase(),
        questions: survey.questions
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteSurvey(id: string) {
    // Responses will be deleted by Cascade if set up in Supabase, 
    // but let's do it manually just in case or if no cascade.
    await supabase.from('responses').delete().eq('survey_id', id);
    const { error } = await supabase.from('surveys').delete().eq('id', id);
    if (error) throw error;
  },

  async getResponses(surveyId: string) {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('survey_id', surveyId)
      .order('submitted_at', { ascending: false });
    
    if (error) throw error;
    return data.map(r => ({
      id: r.id,
      surveyId: r.survey_id,
      answers: r.answers,
      submittedAt: r.submitted_at
    })) as Response[];
  },

  async submitResponse(response: Omit<Response, 'id' | 'submittedAt'>) {
    const { data, error } = await supabase
      .from('responses')
      .insert([{
        survey_id: response.surveyId,
        answers: response.answers,
        submitted_at: Date.now()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
