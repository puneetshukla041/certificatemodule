// D:\ssistudios\ssistudios\components\Certificates\CertificateTable.tsx

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Inbox, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

import { useCertificateData } from './hooks/useCertificateData';
import { useCertificateActions } from './hooks/useCertificateActions';
import { useMailCertificate } from './hooks/useMailCertificate'; 
import { CertificateTableProps, PAGE_LIMIT, NotificationState, NotificationType } from './utils/constants';

import AddCertificateForm from './ui/AddCertificateForm';
import QuickActionBar from './ui/QuickActionBar';
import TableHeader from './ui/TableHeader';
import TableRow from './ui/TableRow';
import MailComposer from './ui/MailComposer';
import FloatingNotification from './ui/FloatingNotification';

// ... (SkeletonLoader Component remains same) ...
const SkeletonLoader = () => (
    <div className="w-full space-y-6">
        <div className="h-16 bg-slate-100/50 rounded-2xl border border-slate-200/60 animate-pulse" />
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-50">
                {Array(6).fill(0).map((_, i) => (
                    <div key={i} className="h-20 flex items-center px-6 gap-6 animate-pulse">
                        <div className="w-5 h-5 rounded bg-slate-200" />
                        <div className="space-y-2 flex-1"><div className="w-1/4 h-4 rounded bg-slate-200" /></div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

interface CertificateTableExtendedProps extends CertificateTableProps {
    searchQuery: string;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    hospitalFilter: string;
    setHospitalFilter: React.Dispatch<React.SetStateAction<string>>;
    isAddFormVisible: boolean;
    setIsAddFormVisible: React.Dispatch<React.SetStateAction<boolean>>;
    uniqueHospitals?: string[];
}

const CertificateTable: React.FC<CertificateTableExtendedProps> = ({ 
    refreshKey, onRefresh, searchQuery, setSearchQuery, hospitalFilter, setHospitalFilter, isAddFormVisible, setIsAddFormVisible, uniqueHospitals: _propUniqueHospitals 
}) => {
    
    const [notification, setNotification] = useState<NotificationState | null>(null);

    const showNotification = useCallback((message: string, type: NotificationType) => {
        setNotification({ message, type, active: true });
        setTimeout(() => setNotification(prev => prev ? { ...prev, active: false } : null), 3000);
        setTimeout(() => setNotification(null), 3500);
    }, []);

    const pdfOnAlert = useCallback((message: string, isError: boolean) => {
        if (!isError && (message.includes('synchronized') || message.includes('loaded'))) return;
        showNotification(message, isError ? 'error' : 'info');
    }, [showNotification]);

    const {
        certificates, isLoading, totalItems, currentPage, totalPages, uniqueHospitals, sortConfig, selectedIds,
        fetchCertificates, fetchCertificatesForExport, setCurrentPage, setSelectedIds, requestSort, sortedCertificates, setIsLoading,
    } = useCertificateData(refreshKey, onRefresh, showNotification, searchQuery, hospitalFilter, setSearchQuery, setHospitalFilter); 

    const {
        editingId, editFormData, newCertificateData, isAdding, flashId, deletingId, generatingPdfId, generatingPdfV1Id, isBulkGeneratingV1, isBulkGeneratingV2, 
        setEditingId, setNewCertificateData, setFlashId, handleSelectOne, handleSelectAll, handleBulkDelete, handleEdit, handleSave, handleDelete, handleChange, handleAddCertificate, handleNewCertChange, handleDownload, 
        handleGeneratePDF_V1, handleGeneratePDF_V2, handleBulkGeneratePDF_V1, handleBulkGeneratePDF_V2,
        handleRestrictedAdminNotify 
    } = useCertificateActions({
        certificates, selectedIds, setSelectedIds, fetchCertificates, fetchCertificatesForExport, showNotification, onAlert: pdfOnAlert, setIsLoading,
    });
    
    const {
        isMailComposerOpen, mailComposerCert, mailComposerPdfBlob, isSending,
        handleOpenMailComposer, handleSendMail, handleCloseMailComposer,
    } = useMailCertificate(pdfOnAlert); 

    const isAnyActionLoading = isMailComposerOpen || isSending || isBulkGeneratingV1 || isBulkGeneratingV2;

    useEffect(() => {
        if (flashId) {
            const timer = setTimeout(() => setFlashId(null), 1000); 
            return () => clearTimeout(timer);
        }
    }, [flashId, setFlashId]);

    // 🚨 SMART MAIL HANDLER
    // If approved -> Open Composer. If Locked -> Send Notification.
    const handleSmartMailAction = (cert: any, template: any) => {
        if (cert.isApproved) {
            handleOpenMailComposer(cert, template);
        } else {
            handleRestrictedAdminNotify(cert, `Send Mail (${template})`);
        }
    };

    if (isLoading) return <SkeletonLoader />;

    return (
        <div className="relative flex flex-col gap-6 font-sans">
            <FloatingNotification 
                message={notification?.message || ''} type={notification?.type || 'info'} isVisible={!!notification?.active} onClose={() => setNotification(null)}
            />
            
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <QuickActionBar
                    isAddFormVisible={isAddFormVisible} selectedIds={selectedIds} uniqueHospitals={uniqueHospitals} hospitalFilter={hospitalFilter}
                    setIsAddFormVisible={setIsAddFormVisible} setHospitalFilter={setHospitalFilter} handleBulkDelete={handleBulkDelete} handleDownload={handleDownload}
                    isBulkGeneratingV1={isBulkGeneratingV1} isBulkGeneratingV2={isBulkGeneratingV2} handleBulkGeneratePDF_V1={handleBulkGeneratePDF_V1} handleBulkGeneratePDF_V2={handleBulkGeneratePDF_V2}
                />
            </motion.div>

            <AnimatePresence>
                {isAddFormVisible && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
                        <AddCertificateForm
                            newCertificateData={newCertificateData} isAdding={isAdding} uniqueHospitals={uniqueHospitals}
                            handleNewCertChange={handleNewCertChange} handleAddCertificate={handleAddCertificate}
                            setIsAddFormVisible={setIsAddFormVisible} setNewCertificateData={setNewCertificateData}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-grow relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {isAnyActionLoading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-50 flex items-center justify-center">
                        <div className="bg-white p-4 rounded-xl shadow-xl flex items-center gap-3">
                            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" /><span className="text-sm font-medium">Processing...</span>
                        </div>
                    </div>
                )}

                {sortedCertificates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                        <Inbox className="w-10 h-10 text-slate-300 mb-4" strokeWidth={1.5} />
                        <h3 className="text-xl font-semibold text-slate-900">No certificates found</h3>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <TableHeader certificates={certificates} selectedIds={selectedIds} sortConfig={sortConfig} requestSort={requestSort} handleSelectAll={handleSelectAll} />
                                <tbody className="divide-y divide-slate-100/80 bg-white">
                                    {sortedCertificates.map((cert, index) => ( 
                                        <TableRow
                                            key={cert._id} cert={cert} index={index} currentPage={currentPage} isSelected={selectedIds.includes(cert._id)}
                                            isEditing={editingId === cert._id} isFlashing={flashId === cert._id} isDeleting={deletingId === cert._id}
                                            generatingPdfId={generatingPdfId} generatingPdfV1Id={generatingPdfV1Id} editFormData={editFormData}
                                            handleSelectOne={handleSelectOne} handleEdit={handleEdit} handleSave={handleSave} handleDelete={handleDelete} handleChange={handleChange} setEditingId={setEditingId}
                                            handleGeneratePDF_V1={handleGeneratePDF_V1} handleGeneratePDF_V2={handleGeneratePDF_V2}
                                            // 💡 Pass the Smart Logic
                                            handleMailCertificate={handleSmartMailAction} 
                                            isAnyActionLoading={isAnyActionLoading}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination controls simplified for brevity but needed */}
                        <div className="border-t border-slate-100 p-4 flex justify-between items-center">
                             <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 disabled:opacity-30"><ChevronLeft /></button>
                             <span>Page {currentPage} of {totalPages}</span>
                             <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 disabled:opacity-30"><ChevronRight /></button>
                        </div>
                    </>
                )}
            </motion.div>
            
            <AnimatePresence>
                {isMailComposerOpen && mailComposerCert && (
                    <MailComposer certData={mailComposerCert} pdfBlob={mailComposerPdfBlob} isSending={isSending} onClose={handleCloseMailComposer} onSend={handleSendMail} onAlert={pdfOnAlert} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default CertificateTable;