
import { Bimester, LevelRule } from '../types';

export const LEVEL_RULES: Record<Bimester, LevelRule[]> = {
  1: [
    { min: 0, max: 199, title: "Recruta", color: "bg-slate-400" },
    { min: 200, max: 399, title: "Guerreiro(a)", color: "bg-blue-400" },
    { min: 400, max: 599, title: "Porta-voz", color: "bg-indigo-500" },
    { min: 600, max: 799, title: "Mestre", color: "bg-purple-600" },
    { min: 800, max: null, title: "V. Excelência", color: "bg-amber-500" },
  ],
  2: [
    { min: 0, max: 199, title: "6-7", color: "bg-slate-400" },
    { min: 200, max: 399, title: "Aprendiz", color: "bg-green-400" },
    { min: 400, max: 599, title: "Ajudante", color: "bg-teal-500" },
    { min: 600, max: 799, title: "Tutor", color: "bg-cyan-600" },
    { min: 800, max: 999, title: "Mestre", color: "bg-purple-600" },
    { min: 1000, max: null, title: "Profissional", color: "bg-amber-500" },
  ],
  3: [
    { min: 0, max: 199, title: "Bebê", color: "bg-slate-400" },
    { min: 200, max: 399, title: "Esperto(a)", color: "bg-lime-400" },
    { min: 400, max: 599, title: "Esforçado(a)", color: "bg-emerald-500" },
    { min: 600, max: 799, title: "Escritor(a)", color: "bg-pink-600" },
    { min: 800, max: 999, title: "Mestre", color: "bg-purple-600" },
    { min: 1000, max: null, title: "Desafiante", color: "bg-red-500" },
  ],
  4: [
    { min: 0, max: 199, title: "Iniciante", color: "bg-slate-400" },
    { min: 200, max: 399, title: "Carpinteiro(a)", color: "bg-orange-400" },
    { min: 400, max: 599, title: "Mercador(a)", color: "bg-yellow-500" },
    { min: 600, max: 799, title: "Graduado(a)", color: "bg-blue-600" },
    { min: 800, max: 999, title: "Mestre", color: "bg-purple-600" },
    { min: 1000, max: null, title: "Acadêmico", color: "bg-amber-500" },
  ]
};

export const getLevel = (points: number, bimester: Bimester, customRules?: Partial<Record<Bimester, LevelRule[]>>): LevelRule => {
  const rules = (customRules?.[bimester]) || LEVEL_RULES[bimester];
  return rules.find(r => points >= r.min && (r.max === null || points <= r.max)) || rules[0];
};

export const getNextLevel = (points: number, bimester: Bimester, customRules?: Partial<Record<Bimester, LevelRule[]>>): { pointsNeeded: number, nextTitle: string } | null => {
  const rules = (customRules?.[bimester]) || LEVEL_RULES[bimester];
  const current = getLevel(points, bimester, customRules);
  if (current.max === null) return null; // Nível máximo

  const next = rules.find(r => r.min > current.min);

  if (!next) return null;
  return { pointsNeeded: next.min - points, nextTitle: next.title };
};

// Colors available for level tiers
export const LEVEL_COLORS = [
  'bg-slate-400', 'bg-blue-400', 'bg-green-400', 'bg-teal-500',
  'bg-indigo-500', 'bg-purple-600', 'bg-pink-600', 'bg-rose-500',
  'bg-amber-500', 'bg-orange-400', 'bg-yellow-500', 'bg-lime-400',
  'bg-cyan-600', 'bg-emerald-500', 'bg-red-500'
];
