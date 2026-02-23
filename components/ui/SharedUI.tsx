import React, { useState } from 'react';

export const Button = ({ onClick, children, variant = 'primary', className = '', disabled = false, title = '' }: any) => {
    const base = "px-4 py-3 md:py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex-shrink-0 touch-manipulation";
    const variants: any = {
        primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200",
        secondary: "bg-white border-2 border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600",
        danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
        success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200",
        warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-200",
        icon: "w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm"
    };
    return <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`} title={title}>{children}</button>;
};

export const Input = ({ label, ...props }: any) => (
    <div className="mb-4">
        {label && <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>}
        <input {...props} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors" />
    </div>
);

export const GenericModal = ({ title, onClose, onSave, children, saveLabel = "Salvar", saveVariant = "primary", showFooter = true }: any) => (
    <div className="fixed inset-0 bg-slate-900/60 flex items-end md:items-center justify-center z-50 backdrop-blur-sm p-0 md:p-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white rounded-t-2xl md:rounded-2xl p-6 w-full md:max-w-md shadow-2xl transform transition-all scale-100 max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h3 className="text-xl font-bold text-slate-800">{title}</h3>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors"><i className="fas fa-times text-lg"></i></button>
            </div>
            <div className={`space-y-4 overflow-y-auto custom-scrollbar ${showFooter ? 'mb-6' : ''}`}>
                {children}
            </div>
            {(showFooter && onSave) && (
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 flex-shrink-0">
                    <Button variant="secondary" onClick={onClose} className="flex-1 md:flex-none">Cancelar</Button>
                    <Button onClick={onSave} variant={saveVariant} className="flex-1 md:flex-none">{saveLabel}</Button>
                </div>
            )}
        </div>
    </div>
);

export const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    variant = "danger"
}: any) => {
    if (!isOpen) return null;

    const variantStyles: any = {
        danger: { icon: "fa-exclamation-triangle", bg: "bg-red-100", text: "text-red-500", btn: "danger" },
        warning: { icon: "fa-info-circle", bg: "bg-amber-100", text: "text-amber-500", btn: "warning" },
        primary: { icon: "fa-question-circle", bg: "bg-indigo-100", text: "text-indigo-500", btn: "primary" },
        success: { icon: "fa-check-circle", bg: "bg-emerald-100", text: "text-emerald-500", btn: "success" }
    };

    const style = variantStyles[variant] || variantStyles.primary;

    return (
        <GenericModal
            title={title}
            onClose={onClose}
            onSave={onConfirm}
            saveLabel={confirmLabel}
            saveVariant={style.btn}
        >
            <div className="text-center py-4">
                <div className={`w-20 h-20 ${style.bg} rounded-full flex items-center justify-center mx-auto mb-6 ${style.text} text-3xl shadow-inner`}>
                    <i className={`fas ${style.icon}`}></i>
                </div>
                <p className="text-slate-600 text-sm md:text-base font-medium px-4 leading-relaxed">{message}</p>
            </div>
        </GenericModal>
    );
};

export const BatchStudentModal = ({ onClose, onSave }: any) => {
    const [text, setText] = useState('');
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg animate-fade-in shadow-2xl">
                <h3 className="text-xl font-bold mb-2">Importar Lista de Alunos</h3>
                <p className="text-sm text-slate-500 mb-4">Cole a lista de nomes abaixo (um nome por linha).</p>
                <textarea
                    className="w-full h-48 bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm mb-4 focus:border-indigo-500 outline-none font-mono"
                    placeholder="Ana Silva&#10;Bruno Souza&#10;Carlos Lima..."
                    value={text}
                    onChange={e => setText(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={() => onSave(text)} variant="success">Importar Agora</Button>
                </div>
            </div>
        </div>
    );
};
