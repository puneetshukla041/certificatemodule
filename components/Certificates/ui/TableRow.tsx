import React, { useState, useRef, useEffect } from 'react';
import {
    Save,
    X,
    Edit3,
    Trash2,
    Loader2,
    Check,
    FileText,
    Calendar,
    Building2,
    User,
    Download,
    Mail,
    ChevronDown,
    Shield,
    Award,
    Star,
    Layout,
    Lock,
    Unlock,
    AlertCircle
} from 'lucide-react';
import { ICertificateClient, PAGE_LIMIT, CERTIFICATE_TEMPLATES, CERTIFICATE_TYPES } from '../utils/constants';
import { getHospitalColor, doiToDateInput, dateInputToDoi } from '../utils/helpers';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface TableRowProps {
    cert: ICertificateClient;
    index: number;
    currentPage: number;
    isSelected: boolean;
    isEditing: boolean;
    isFlashing: boolean;
    isDeleting: boolean;
    generatingPdfId: string | null;
    generatingPdfV1Id: string | null;
    isAnyActionLoading: boolean;
    editFormData: Partial<ICertificateClient>;
    handleSelectOne: (id: string, checked: boolean) => void;
    handleEdit: (certificate: ICertificateClient) => void;
    handleSave: (id: string) => Promise<void>;
    handleDelete: (id: string) => Promise<void>;
    handleChange: (field: keyof ICertificateClient, value: string) => void;
    setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
    handleGeneratePDF_V1: (cert: ICertificateClient) => void;
    handleGeneratePDF_V2: (cert: ICertificateClient) => void;
    handleMailCertificate: (cert: ICertificateClient, template: 'certificate1.pdf' | 'certificate2.pdf') => void;
}

// --- Internal Component: Smart Action Menu ---
const SmartActionMenu = ({
    cert,
    isDisabled,
    isLoading,
    onGenerateV1,
    onGenerateV2,
    onMailV1,
    onMailV2
}: {
    cert: ICertificateClient;
    isDisabled: boolean;
    isLoading: boolean;
    onGenerateV1: () => void;
    onGenerateV2: () => void;
    onMailV1: () => void;
    onMailV2: () => void;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [certType, setCertType] = useState<string>('');
    const [template, setTemplate] = useState<string>('');
    const menuRef = useRef<HTMLDivElement>(null);

    // 💡 CHECK APPROVAL STATUS
    const isApproved = cert.isApproved === true;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            const t = setTimeout(() => {
                setCertType('');
                setTemplate('');
            }, 300);
            return () => clearTimeout(t);
        }
    }, [isOpen]);

    const handleDownload = () => {
        if (certType === 'external') {
            if (template === 'proctorship') onGenerateV1();
            if (template === 'training') onGenerateV2();
        } else {
            alert('Templates for Internal certificates will be added in a future update.');
        }
    };

    const handleMail = () => {
        if (certType === 'external') {
            if (template === 'proctorship') onMailV1();
            if (template === 'training') onMailV2();
        } else {
            alert('Mail feature for Internal certificates will be added in a future update.');
        }
    };

    return (
        <div className="relative w-full md:w-auto" ref={menuRef}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                disabled={isDisabled}
                className={clsx(
                    "flex items-center justify-between md:justify-center gap-2 px-3 py-2 md:py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border shadow-sm select-none w-full md:w-auto",
                    isOpen 
                        ? "bg-slate-800 text-white border-slate-800" 
                        : isApproved
                            ? "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                            : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100", // 💡 Locked Style
                    isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"
                )}
            >
                <div className="flex items-center gap-2">
                    {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isApproved ? (
                        <Layout className="w-3.5 h-3.5" />
                    ) : (
                        <Lock className="w-3.5 h-3.5" /> // 💡 Lock Icon
                    )}
                    <span>{isApproved ? "Actions" : "Restricted"}</span>
                </div>
                <ChevronDown className={clsx("w-3 h-3 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 md:left-auto md:right-0 bottom-full md:bottom-auto md:top-full mb-2 md:mt-2 w-64 p-4 bg-white rounded-xl shadow-xl border border-slate-100 z-[100] origin-bottom-left md:origin-top-right ring-1 ring-slate-900/5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 💡 STATUS HEADER */}
                        <div className="mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Status</span>
                            {isApproved ? (
                                <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                                    <Unlock className="w-3 h-3" /> Unlocked
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100">
                                    <Lock className="w-3 h-3" /> Locked
                                </span>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                                    Certificate Type
                                </label>
                                <div className="relative group">
                                    <select
                                        value={certType}
                                        onChange={(e) => {
                                            setCertType(e.target.value);
                                            setTemplate('');
                                        }}
                                        className="w-full text-sm bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-all"
                                    >
                                        <option value="" disabled>Select Type...</option>
                                        {CERTIFICATE_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <AnimatePresence mode='wait'>
                                {certType && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-1.5 overflow-hidden"
                                    >
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                                            Select Template
                                        </label>
                                        <div className="relative group">
                                            <select
                                                value={template}
                                                onChange={(e) => setTemplate(e.target.value)}
                                                className="w-full text-sm bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer hover:bg-slate-100 transition-all"
                                            >
                                                <option value="" disabled>Select Template...</option>
                                                {/* @ts-ignore */}
                                                {CERTIFICATE_TEMPLATES[certType as keyof typeof CERTIFICATE_TEMPLATES]?.map((t: any) => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>

                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                                {template === 'proctorship' && <Shield className="w-3.5 h-3.5 text-blue-500" />}
                                                {template === 'training' && <Award className="w-3.5 h-3.5 text-teal-500" />}
                                                {template === 'eom' && <Star className="w-3.5 h-3.5 text-purple-500" />}
                                                {!template && <ChevronDown className="w-3.5 h-3.5" />}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {template && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100"
                                    >
                                        {/* 💡 DYNAMIC BUTTONS BASED ON STATUS */}
                                        <button
                                            onClick={handleDownload}
                                            className={clsx(
                                                "flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 cursor-pointer active:scale-95 border",
                                                isApproved 
                                                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:shadow-blue-200" 
                                                    : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                            )}
                                        >
                                            {isApproved ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                            <span>{isApproved ? "Download" : "Request"}</span>
                                        </button>

                                        <button
                                            onClick={handleMail}
                                            className={clsx(
                                                "flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-xs font-semibold shadow-sm transition-all duration-200 cursor-pointer active:scale-95 border",
                                                isApproved 
                                                    ? "bg-teal-600 text-white border-teal-600 hover:bg-teal-700 hover:shadow-teal-200" 
                                                    : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                            )}
                                        >
                                            {isApproved ? <Mail className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                            <span>{isApproved ? "Email" : "Request"}</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const TableRow: React.FC<TableRowProps> = ({
    cert,
    index,
    currentPage,
    isSelected,
    isEditing,
    isFlashing,
    isDeleting,
    generatingPdfId,
    generatingPdfV1Id,
    isAnyActionLoading,
    editFormData,
    handleSelectOne,
    handleEdit,
    handleSave,
    handleDelete,
    handleChange,
    setEditingId,
    handleGeneratePDF_V1,
    handleGeneratePDF_V2,
    handleMailCertificate,
}) => {

    const serialNumber = (currentPage - 1) * PAGE_LIMIT + index + 1;
    const isPdfGenerating = generatingPdfId === cert._id || generatingPdfV1Id === cert._id;
    const isDisabled = isPdfGenerating || isAnyActionLoading || (isEditing && !editFormData);

    const MobileLabel = ({ children }: { children: React.ReactNode }) => (
        <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2 min-w-[80px]">
            {children}
        </span>
    );

    return (
        <tr
            className={clsx(
                "block md:table-row mb-4 md:mb-0 bg-white md:bg-transparent rounded-xl md:rounded-none shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] md:shadow-none border border-slate-200 md:border-0 md:border-b md:border-slate-100",
                isSelected ? "md:bg-indigo-50/60 ring-1 ring-indigo-500 md:ring-0" : "hover:bg-slate-50",
                isDeleting && "opacity-0 -translate-x-4 pointer-events-none transition-all duration-300",
                isEditing && "bg-amber-50/50"
            )}
            style={isFlashing ? { backgroundColor: 'rgba(240, 253, 244, 1)', transition: 'background-color 0.5s ease' } : {}}
        >
            <td className="flex md:table-cell items-center justify-between p-3 md:px-4 md:py-4 border-b border-slate-100 md:border-0">
                <MobileLabel>Select</MobileLabel>
                <div className="flex items-center justify-center md:justify-center w-full md:w-auto">
                    <label className={clsx(
                        "relative flex items-center justify-center w-8 h-8 rounded-full transition-colors hover:bg-slate-100",
                        isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                    )}>
                        <input
                            type="checkbox"
                            className={clsx(
                                "peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-indigo-600 checked:border-indigo-600 transition-all duration-200",
                                isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                            )}
                            checked={isSelected}
                            onChange={(e) => handleSelectOne(cert._id, e.target.checked)}
                            disabled={isDisabled}
                        />
                        <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-200 scale-0 peer-checked:scale-100" strokeWidth={3} />
                    </label>
                </div>
            </td>

            <td className="hidden md:table-cell px-4 py-4 text-center">
                <span className="text-xs font-medium text-slate-400 font-mono">
                    {String(serialNumber).padStart(2, '0')}
                </span>
            </td>

            <td className="flex md:table-cell items-center justify-between p-3 md:px-4 md:py-4 border-b border-slate-100 md:border-0">
                <MobileLabel>Cert No.</MobileLabel>
                <div className="w-full md:w-auto text-right md:text-left">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editFormData.certificateNo || ''}
                            onChange={(e) => handleChange('certificateNo', e.target.value)}
                            className="w-full md:w-auto px-3 py-1.5 text-sm bg-white border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-sm cursor-text text-right md:text-left"
                            placeholder="Cert No."
                        />
                    ) : (
                        <div className="flex items-center justify-end md:justify-start gap-2">
                            <div className="p-1.5 rounded-md bg-slate-50 text-slate-400 hidden md:block">
                                <FileText className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-sm font-bold text-slate-700 font-mono tracking-tight break-all">
                                {cert.certificateNo}
                            </span>
                        </div>
                    )}
                </div>
            </td>

            <td className="flex md:table-cell items-center justify-between p-3 md:px-4 md:py-4 border-b border-slate-100 md:border-0">
                <MobileLabel>Name</MobileLabel>
                <div className="w-full md:w-auto text-right md:text-left">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editFormData.name || ''}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full md:w-auto px-3 py-1.5 text-sm bg-white border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-sm cursor-text text-right md:text-left"
                            placeholder="Name"
                        />
                    ) : (
                        <div className="flex items-center justify-end md:justify-start gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 hidden md:flex items-center justify-center text-slate-400 shrink-0">
                                <User className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-semibold text-slate-900 line-clamp-1">
                                {cert.name}
                            </span>
                        </div>
                    )}
                </div>
            </td>

            <td className="flex md:table-cell items-center justify-between p-3 md:px-4 md:py-4 border-b border-slate-100 md:border-0">
                <MobileLabel>Hospital</MobileLabel>
                <div className="w-full md:w-auto text-right md:text-left">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editFormData.hospital || ''}
                            onChange={(e) => handleChange('hospital', e.target.value)}
                            className="w-full md:w-auto px-3 py-1.5 text-sm bg-white border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-sm cursor-text text-right md:text-left"
                            placeholder="Hospital"
                        />
                    ) : (
                        <span className={clsx(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-sm cursor-default",
                            getHospitalColor(cert.hospital)
                        )}>
                            <Building2 className="w-3 h-3" />
                            {cert.hospital}
                        </span>
                    )}
                </div>
            </td>

            <td className="flex md:table-cell items-center justify-between p-3 md:px-4 md:py-4 border-b border-slate-100 md:border-0">
                <MobileLabel>Date</MobileLabel>
                <div className="w-full md:w-auto text-right md:text-left">
                    {isEditing ? (
                        <input
                            type="date"
                            value={doiToDateInput(editFormData.doi || '')}
                            onChange={(e) => handleChange('doi', dateInputToDoi(e.target.value))}
                            className="w-full md:w-auto px-3 py-1.5 text-sm bg-white border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-sm cursor-pointer"
                        />
                    ) : (
                        <div className="flex items-center justify-end md:justify-start gap-2 text-slate-500">
                            <Calendar className="w-3.5 h-3.5 hidden md:block" />
                            <span className="text-sm">
                                {cert.doi}
                            </span>
                        </div>
                    )}
                </div>
            </td>

            <td className="block md:table-cell p-3 md:px-4 md:py-4 bg-slate-50 md:bg-transparent rounded-b-xl md:rounded-none border-t border-slate-200 md:border-0">
                <div className="w-full md:w-auto relative">
                    {isEditing ? (
                        <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200 w-full justify-end">
                            <button
                                onClick={() => handleSave(cert._id)}
                                className="flex-1 md:flex-none justify-center flex items-center gap-1.5 px-3 py-2 md:py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md shadow-sm transition-all cursor-pointer active:scale-95"
                            >
                                <Save className="w-3.5 h-3.5" />
                                Save
                            </button>
                            <button
                                onClick={() => setEditingId(null)}
                                className="flex-1 md:flex-none justify-center flex items-center gap-1.5 px-3 py-2 md:py-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 text-xs font-medium rounded-md shadow-sm transition-all cursor-pointer active:scale-95"
                            >
                                <X className="w-3.5 h-3.5" />
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-[1fr_auto_auto] md:flex items-center justify-end gap-2 md:gap-2">
                            <SmartActionMenu
                                cert={cert}
                                isDisabled={isDisabled}
                                isLoading={isPdfGenerating}
                                onGenerateV1={() => handleGeneratePDF_V1(cert)}
                                onGenerateV2={() => handleGeneratePDF_V2(cert)}
                                onMailV1={() => handleMailCertificate(cert, 'certificate1.pdf')}
                                onMailV2={() => handleMailCertificate(cert, 'certificate2.pdf')}
                            />

                            <div className="hidden md:block w-px h-5 bg-slate-200 mx-1" />

                            <button
                                onClick={() => handleEdit(cert)}
                                disabled={isDisabled}
                                className={clsx(
                                    "p-2.5 md:p-2 rounded-lg transition-all duration-200 flex items-center justify-center",
                                    isDisabled
                                        ? "text-slate-300 cursor-not-allowed bg-slate-100"
                                        : "text-slate-500 hover:text-amber-600 hover:bg-amber-50 cursor-pointer active:scale-90 bg-white md:bg-transparent border border-slate-200 md:border-0 shadow-sm md:shadow-none"
                                )}
                                title="Edit Record"
                            >
                                <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                                onClick={() => handleDelete(cert._id)}
                                disabled={isDisabled}
                                className={clsx(
                                    "p-2.5 md:p-2 rounded-lg transition-all duration-200 flex items-center justify-center",
                                    isDisabled
                                        ? "text-slate-300 cursor-not-allowed bg-slate-100"
                                        : "text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer active:scale-90 bg-white md:bg-transparent border border-slate-200 md:border-0 shadow-sm md:shadow-none"
                                )}
                                title="Delete Record"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default TableRow;