import React, { useState, useMemo } from 'react';
import { Button } from '../ui/SharedUI';
import { Student } from '../../types';

export interface AvatarItem {
    id: string;
    category: '01' | '02' | '03' | '04';
    price: number;
    unlockLxc: number;
    name: string;
}

interface StoreViewProps {
    student: Student;
    currentLxc: number;
    onClose: () => void;
    onUpdateStudent: (updatedStudent: Student) => void;
}

const CATEGORY_MAP = {
    '01': { name: 'Básicos', minLxc: 0, price: 5 },
    '02': { name: 'Humanos', minLxc: 500, price: 10 },
    '03': { name: 'Galácticos', minLxc: 700, price: 15 },
    '04': { name: 'Épicos', minLxc: 900, price: 20 },
};

export const StoreView: React.FC<StoreViewProps> = ({ student, currentLxc, onClose, onUpdateStudent }) => {
    const [storeSection, setStoreSection] = useState<'menu' | 'avatars' | 'privileges' | 'rewards'>('menu');
    const [activeTab, setActiveTab] = useState<'01' | '02' | '03' | '04'>('01');
    const [confirmingAvatar, setConfirmingAvatar] = useState<AvatarItem | null>(null);

    const isLocked = currentLxc < 242;

    // First time free choice logic
    React.useEffect(() => {
        if (!isLocked && student.freeAvatarChoices === undefined) {
            onUpdateStudent({
                ...student,
                freeAvatarChoices: 1 // Initial free choice
            });
        }
    }, [isLocked, student.freeAvatarChoices, student.id]);

    // Generate avatars based on the 16 we saw + assuming others follow the pattern
    const avatars = useMemo(() => {
        const list: AvatarItem[] = [];
        // Category 01: 16 avatars
        for (let i = 1; i <= 16; i++) {
            const id = `avatar01${i.toString().padStart(2, '0')}`;
            list.push({ id, category: '01', price: 5, unlockLxc: 0, name: `Básico ${i}` });
        }
        // Categories 02-04: Assuming 4 per category for now to fill UI
        for (let cat of ['02', '03', '04'] as const) {
            for (let i = 1; i <= 4; i++) {
                const id = `avatar${cat}${i.toString().padStart(2, '0')}`;
                list.push({
                    id,
                    category: cat,
                    price: CATEGORY_MAP[cat].price,
                    unlockLxc: CATEGORY_MAP[cat].minLxc,
                    name: `${CATEGORY_MAP[cat].name} ${i}`
                });
            }
        }
        return list;
    }, []);

    const handleSelectOrBuy = (avatar: AvatarItem) => {
        const isOwned = student.ownedAvatars?.includes(avatar.id);
        const hasFreeChoice = (student.freeAvatarChoices || 0) > 0;
        const currentCurrency = student.currency || 0;

        if (isOwned) {
            // Just select directly
            onUpdateStudent({ ...student, avatarId: avatar.id });
            return;
        }

        // Check if can obtain
        if (hasFreeChoice || currentCurrency >= avatar.price) {
            setConfirmingAvatar(avatar);
        } else {
            alert("Saldo de ❀ insuficiente!");
        }
    };

    const confirmPurchase = () => {
        if (!confirmingAvatar) return;
        const avatar = confirmingAvatar;
        const hasFreeChoice = (student.freeAvatarChoices || 0) > 0;
        const currentCurrency = student.currency || 0;
        const updatedOwned = [...(student.ownedAvatars || []), avatar.id];

        if (hasFreeChoice) {
            onUpdateStudent({
                ...student,
                ownedAvatars: updatedOwned,
                avatarId: avatar.id,
                freeAvatarChoices: Math.max(0, (student.freeAvatarChoices || 0) - 1)
            });
        } else if (currentCurrency >= avatar.price) {
            onUpdateStudent({
                ...student,
                ownedAvatars: updatedOwned,
                avatarId: avatar.id,
                currency: currentCurrency - avatar.price
            });
        }
        setConfirmingAvatar(null);
    };

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/95 z-[60] backdrop-blur-md p-4 md:p-8 flex flex-col animate-fade-in cursor-pointer"
        >
            <div
                onClick={e => e.stopPropagation()}
                className="max-w-5xl mx-auto w-full flex flex-col h-full cursor-default bg-slate-900/50 rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl relative"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-900/80 to-purple-900/80 p-8 flex justify-between items-center border-b border-white/10">
                    <div className="flex items-center gap-4">
                        {storeSection !== 'menu' && (
                            <button
                                onClick={() => setStoreSection('menu')}
                                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all border border-white/10"
                            >
                                <i className="fas fa-arrow-left"></i>
                            </button>
                        )}
                        <div>
                            <h2 className="text-3xl font-black text-white gamified-font tracking-wider uppercase">Lojinha dos Mestres da Linguagem</h2>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="bg-amber-400 text-slate-900 px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1">
                                    <span className="text-sm leading-none">❀</span> {student.currency || 0} FLORES
                                </span>
                                {student.freeAvatarChoices && student.freeAvatarChoices > 0 ? (
                                    <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest animate-pulse border-2 border-emerald-400">
                                        <i className="fas fa-magic mr-1"></i> {student.freeAvatarChoices} TROCAS GRÁTIS!
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all border border-white/20 group"
                    >
                        <i className="fas fa-times text-xl group-hover:rotate-90 transition-transform"></i>
                    </button>
                </div>

                {isLocked ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 p-12">
                        <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center text-6xl text-slate-600 border-4 border-slate-700 shadow-2xl relative">
                            <i className="fas fa-lock text-slate-500"></i>
                            <div className="absolute -bottom-2 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full border-2 border-slate-900 uppercase">Bloqueado</div>
                        </div>
                        <div className="max-w-md">
                            <h3 className="text-2xl font-black text-white mb-2 gamified-font">Jardim das Flores de Lácio</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">A Lojinha dos Mestres da Linguagem está atualmente em manutenção para você. Alcance <span className="text-amber-400 font-black">242 LXC</span> para explorar o Jardim!</p>
                        </div>
                        <div className="w-full max-w-xs bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700 p-0.5 shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, (currentLxc / 242) * 100)}%` }}
                            ></div>
                        </div>
                        <Button onClick={onClose} variant="secondary" className="px-8 py-2 rounded-full font-bold text-xs uppercase tracking-widest">
                            <i className="fas fa-arrow-left mr-2"></i> Voltar
                        </Button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {storeSection === 'menu' ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8 animate-fade-in">
                                <h3 className="text-xl font-bold text-slate-400 uppercase tracking-[0.2em]">O que deseja explorar hoje?</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                                    <button
                                        onClick={() => setStoreSection('avatars')}
                                        className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2.5rem] shadow-xl hover:scale-105 transition-all group flex flex-col items-center gap-4 border border-white/10"
                                    >
                                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-white text-4xl group-hover:scale-110 transition-transform">
                                            <i className="fas fa-user-astronaut"></i>
                                        </div>
                                        <div className="text-center">
                                            <h4 className="text-2xl font-black text-white gamified-font">AVATARES</h4>
                                            <p className="text-indigo-200 text-xs">Transforme sua aparência</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setStoreSection('privileges')}
                                        className="bg-gradient-to-br from-purple-600 to-purple-800 p-8 rounded-[2.5rem] shadow-xl hover:scale-105 transition-all group flex flex-col items-center gap-4 border border-white/10"
                                    >
                                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-white text-4xl group-hover:scale-110 transition-transform">
                                            <i className="fas fa-bolt"></i>
                                        </div>
                                        <div className="text-center">
                                            <h4 className="text-2xl font-black text-white gamified-font">PRIVILÉGIOS</h4>
                                            <p className="text-purple-200 text-xs">Poderes e habilidades especiais</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setStoreSection('rewards')}
                                        className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 rounded-[2.5rem] shadow-xl hover:scale-105 transition-all group flex flex-col items-center gap-4 border border-white/10"
                                    >
                                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-white text-4xl group-hover:scale-110 transition-transform">
                                            <i className="fas fa-gift"></i>
                                        </div>
                                        <div className="text-center">
                                            <h4 className="text-2xl font-black text-white gamified-font">RECOMPENSAS</h4>
                                            <p className="text-emerald-200 text-xs">Itens e bônus épicos</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        ) : storeSection === 'avatars' ? (
                            <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
                                {/* Tabs */}
                                <div className="flex bg-slate-800/50 p-2 gap-2 overflow-x-auto">
                                    {(Object.keys(CATEGORY_MAP) as Array<'01' | '02' | '03' | '04'>).map(cat => {
                                        const locked = currentLxc < CATEGORY_MAP[cat].minLxc;
                                        return (
                                            <button
                                                key={cat}
                                                disabled={locked}
                                                onClick={() => setActiveTab(cat)}
                                                className={`flex-1 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${locked ? 'opacity-30 cursor-not-allowed bg-slate-900' : (activeTab === cat ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-400')}`}
                                            >
                                                {locked && <i className="fas fa-lock text-[8px]"></i>}
                                                {CATEGORY_MAP[cat].name}
                                                {locked && <span className="text-[8px] opacity-60 ml-1">({CATEGORY_MAP[cat].minLxc})</span>}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Inventory Grid */}
                                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                        {avatars.filter(a => a.category === activeTab).map(avatar => {
                                            const isOwned = student.ownedAvatars?.includes(avatar.id);
                                            const isSelected = student.avatarId === avatar.id;
                                            const hasFreeChoices = (student.freeAvatarChoices || 0) > 0;

                                            return (
                                                <div
                                                    key={avatar.id}
                                                    onClick={() => handleSelectOrBuy(avatar)}
                                                    className={`relative group cursor-pointer transition-all ${isSelected ? 'scale-110' : 'hover:scale-105'}`}
                                                >
                                                    <div className={`aspect-square rounded-[2rem] border-4 transition-all flex items-center justify-center overflow-hidden bg-slate-800 shadow-xl ${isSelected ? 'border-amber-400 shadow-amber-400/20' : (isOwned ? 'border-indigo-500/50' : 'border-white/5 opacity-60 grayscale-[0.5]')}`}>
                                                        <img src={`/assets/avatars/${avatar.id}.png`} alt={avatar.name} className="w-full h-full object-cover text-white" />

                                                        {/* Indicators */}
                                                        {!isOwned && (
                                                            <div className="absolute inset-0 bg-slate-900/40 flex flex-col items-center justify-center gap-2 group-hover:bg-slate-900/60 transition-all">
                                                                {hasFreeChoices && (
                                                                    <div className="bg-emerald-500 text-white px-2 py-1 rounded-full text-[8px] font-black uppercase animate-bounce shadow-lg border border-white/20">
                                                                        Poder Ativo!
                                                                    </div>
                                                                )}
                                                                <div className={`${hasFreeChoices ? 'bg-emerald-400 text-slate-900' : 'bg-amber-400 text-slate-900'} px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-lg`}>
                                                                    <span className="text-[10px] leading-none">{hasFreeChoices ? '✨' : '❀'}</span> {hasFreeChoices ? 'GRÁTIS' : avatar.price}
                                                                </div>
                                                                {hasFreeChoices && (
                                                                    <span className="text-[7px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-800 px-2 py-1 rounded">Voucher disponível</span>
                                                                )}
                                                            </div>
                                                        )}

                                                        {isOwned && !isSelected && (
                                                            <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px] shadow-lg" title="Adquirido">
                                                                <span>❀</span>
                                                            </div>
                                                        )}

                                                        {isSelected && (
                                                            <div className="absolute top-2 right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-slate-900 text-xs shadow-lg animate-bounce border-2 border-slate-900">
                                                                <i className="fas fa-crown"></i>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className={`mt-2 text-center text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-amber-400' : 'text-slate-500'}`}>{avatar.name}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-60 animate-fade-in">
                                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-4xl text-slate-600 mb-6">
                                    <i className="fas fa-tools"></i>
                                </div>
                                <h3 className="text-2xl font-black text-white gamified-font uppercase tracking-widest mb-2">Em Manutenção</h3>
                                <p className="text-slate-400 text-sm">Esta seção da Lojinha está sendo preparada pelos Guardiões de Lácio. Volte em breve!</p>
                                <Button onClick={() => setStoreSection('menu')} variant="secondary" className="mt-8 text-xs font-bold uppercase tracking-[0.2em]">
                                    <i className="fas fa-arrow-left mr-2"></i> Menu Principal
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Info */}
                <div className="p-6 bg-slate-900 border-t border-white/5 text-center flex-shrink-0">
                    <p className="text-slate-600 text-[9px] uppercase tracking-[0.3em] font-medium italic">Mestres da Linguagem — Jardim das Flores de Lácio</p>
                </div>

                {/* --- CONFIRMATION MODAL --- */}
                {confirmingAvatar && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
                        <div className="bg-slate-900 border-2 border-white/10 rounded-[3rem] p-8 max-w-sm w-full shadow-2xl animate-scale-up text-center border-b-8 border-b-indigo-500">
                            <h4 className="text-xl font-black text-white gamified-font uppercase tracking-widest mb-6">Confirmar Escolha</h4>

                            <div className="w-48 h-48 bg-slate-800 rounded-[2.5rem] border-4 border-indigo-500/30 mx-auto mb-6 flex items-center justify-center overflow-hidden shadow-2xl shadow-indigo-500/10">
                                <img src={`/assets/avatars/${confirmingAvatar.id}.png`} alt="Preview" className="w-full h-full object-cover" />
                            </div>

                            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                                Você deseja adquirir o avatar <span className="text-indigo-400 font-bold">"{confirmingAvatar.name}"</span>?
                            </p>

                            <div className="bg-slate-800/50 p-4 rounded-2xl mb-8 border border-white/5 flex items-center justify-center gap-4">
                                {(student.freeAvatarChoices || 0) > 0 ? (
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">Custo</span>
                                        <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-xl font-black text-xs flex items-center gap-2">
                                            <i className="fas fa-magic"></i> VOUCHER GRÁTIS
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1">Custo</span>
                                        <div className="bg-amber-400 text-slate-900 px-4 py-1.5 rounded-xl font-black text-xs flex items-center gap-2">
                                            <span className="text-sm leading-none">❀</span> {confirmingAvatar.price} FLORES
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setConfirmingAvatar(null)}
                                    className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black rounded-2xl text-xs uppercase tracking-widest transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmPurchase}
                                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
