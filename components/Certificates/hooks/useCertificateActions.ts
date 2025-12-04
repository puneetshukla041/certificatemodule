// D:\ssistudios\ssistudios\components\Certificates\hooks\useCertificateActions.ts

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { ICertificateClient, CertificateTableProps, initialNewCertificateState, NotificationType } from '../utils/constants';
import { getTodayDoi, sortCertificates } from '../utils/helpers';
import { generateCertificatePDF } from '../utils/pdfGenerator';

const initialNewCertificate = {
    ...initialNewCertificateState,
    doi: getTodayDoi(),
};

type GeneratePDFType = (
    certData: ICertificateClient,
    onAlert: (message: string, isError: boolean) => void,
    template: 'certificate1.pdf' | 'certificate2.pdf',
    setLoadingId: React.Dispatch<React.SetStateAction<string | null>> | React.Dispatch<React.SetStateAction<boolean>>,
    isBulk?: boolean
) => Promise<{ filename: string, blob: Blob } | null>;

const generateCertificatePDFTyped = generateCertificatePDF as unknown as GeneratePDFType;

interface UseCertificateActionsProps {
    certificates: ICertificateClient[];
    selectedIds: string[];
    setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
    fetchCertificates: (resetPage?: boolean) => Promise<void>;
    fetchCertificatesForExport: (isBulkPdfExport?: boolean, idsToFetch?: string[]) => Promise<ICertificateClient[]>;
    showNotification: (message: string, type: NotificationType) => void;
    onAlert: CertificateTableProps['onAlert'];
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

// ... (Interface UseCertificateActionsResult remains the same as your code) ...
interface UseCertificateActionsResult {
    // ... all the state setters ...
    [key: string]: any; 
}

const formatForFilename = (text: string | undefined | null) => {
    if (!text) return 'Unknown';
    const cleanText = text.replace(/[\\/:*?"<>|]/g, '').trim();
    if (!cleanText) return 'Unknown';
    return cleanText.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

const triggerFileDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

export const useCertificateActions = ({
    certificates,
    selectedIds,
    setSelectedIds,
    fetchCertificates,
    fetchCertificatesForExport,
    showNotification,
    onAlert: oldOnAlert,
    setIsLoading,
}: UseCertificateActionsProps): UseCertificateActionsResult => {
    
    // --- State Definitions (Keeping your existing state) ---
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<ICertificateClient>>({});
    const [isAddFormVisible, setIsAddFormVisible] = useState(false);
    const [newCertificateData, setNewCertificateData] = useState(initialNewCertificate);
    const [isAdding, setIsAdding] = useState(false);
    const [flashId, setFlashId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
    const [generatingPdfV1Id, setGeneratingPdfV1Id] = useState<string | null>(null);
    const [isBulkGeneratingV1, setIsBulkGeneratingV1] = useState(false);
    const [isBulkGeneratingV2, setIsBulkGeneratingV2] = useState(false);

    // --- Standard Handlers (Select, Edit, Delete, Save, Add) ---
    // (I am keeping these exactly as your previous code to save space, assuming they work fine)
    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) setSelectedIds(prev => [...prev, id]);
        else setSelectedIds(prev => prev.filter(sid => sid !== id));
    };
    const handleSelectAll = (checked: boolean) => {
        checked ? setSelectedIds(certificates.map(c => c._id)) : setSelectedIds([]);
    };
    const handleBulkDelete = async () => { /* ... your existing logic ... */ };
    const handleDelete = async (id: string) => { /* ... your existing logic ... */ };
    const handleEdit = (cert: ICertificateClient) => { setEditingId(cert._id); setEditFormData({ ...cert }); };
    const handleSave = async (id: string) => { /* ... your existing logic ... */ };
    const handleChange = (field: keyof ICertificateClient, value: string) => { setEditFormData(prev => ({ ...prev, [field]: value })); };
    const handleAddCertificate = async () => { /* ... your existing logic ... */ };
    const handleNewCertChange = (field: keyof Omit<ICertificateClient, '_id'>, value: string) => { setNewCertificateData(prev => ({ ...prev, [field]: value })); };


    // 🚨 1. RESTRICTED ACTION HANDLER (Sends Email to Admin)
    const handleRestrictedAdminNotify = async (cert: ICertificateClient, actionType: string) => {
        showNotification(`🔒 This action is locked. Sending approval request...`, 'info');
        
        const adminEmail = 'puneet.shukla@ssinnovations.org';
        const mailSubject = `User Request: ${actionType} - ${cert.certificateNo}`;
        const mailContent = `
Request Type: ${actionType}
Requested By: User System

Certificate Details:
---------------------
Name: ${cert.name}
Hospital: ${cert.hospital}
Certificate No: ${cert.certificateNo}
DOI: ${cert.doi}
---------------------

Please approve this request by clicking the link in this email.
        `.trim();

        try {
            const response = await fetch('/api/send-admin-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: adminEmail,
                    subject: mailSubject,
                    text: mailContent,
                    certificateId: cert._id,
                    certificateNo: cert.certificateNo
                })
            });

            const result = await response.json();

            if (result.success) {
                 showNotification(`Request sent to ${adminEmail}. Waiting for approval.`, 'success');
            } else {
                 throw new Error(result.error || "Failed to send request.");
            }

        } catch (error: any) {
            console.error("Admin Notify Error:", error);
            showNotification(`Error sending request: ${error.message}`, 'error');
        }
    };

    // 🚨 2. SMART DOWNLOAD V1 (Proctorship)
    const handleGeneratePDF_V1 = async (cert: ICertificateClient) => {
        // ALGORITHM: If approved -> Download. If not -> Request.
        if (cert.isApproved) {
            if (generatingPdfV1Id === cert._id) return;
            const result = await generateCertificatePDFTyped(cert, oldOnAlert, 'certificate1.pdf', setGeneratingPdfV1Id, true);
            if (result && result.blob) {
                const safeName = formatForFilename(cert.name);
                const safeHospital = formatForFilename(cert.hospital);
                triggerFileDownload(result.blob, `${safeName}_${safeHospital}.pdf`);
            }
        } else {
            await handleRestrictedAdminNotify(cert, 'Download (Proctorship)');
        }
    };

    // 🚨 3. SMART DOWNLOAD V2 (Training)
    const handleGeneratePDF_V2 = async (cert: ICertificateClient) => {
        // ALGORITHM: If approved -> Download. If not -> Request.
        if (cert.isApproved) {
            if (generatingPdfId === cert._id) return;
            const result = await generateCertificatePDFTyped(cert, oldOnAlert, 'certificate2.pdf', setGeneratingPdfId, true);
            if (result && result.blob) {
                const safeName = formatForFilename(cert.name);
                const safeHospital = formatForFilename(cert.hospital);
                triggerFileDownload(result.blob, `${safeName}_${safeHospital}.pdf`);
            }
        } else {
            await handleRestrictedAdminNotify(cert, 'Download (Training)');
        }
    };

    // --- Bulk Handlers (Locked by default) ---
    const handleBulkGeneratePDF_V1 = async () => { showNotification('Bulk actions require specific Admin Approval.', 'error'); };
    const handleBulkGeneratePDF_V2 = async () => { showNotification('Bulk actions require specific Admin Approval.', 'error'); };

    // --- Export Handler ---
    const handleDownload = async (type: 'xlsx' | 'csv') => {
        showNotification('Fetching all records for export...', 'info');
        const allCertificates = await fetchCertificatesForExport();
        if (allCertificates.length === 0) return;

        const sortedExportData = sortCertificates(allCertificates, { key: '_id', direction: 'desc' });
        const dataToExport = sortedExportData.map((cert, index) => ({
            'S. No.': index + 1,
            'Certificate No.': cert.certificateNo,
            'Name': cert.name,
            'Hospital': cert.hospital,
            'DOI': cert.doi,
            'Status': cert.isApproved ? 'Unlocked' : 'Locked' // Added status to excel
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Certificates');
        XLSX.writeFile(workbook, `certificates_export.${type}`);
        showNotification(`Exported ${allCertificates.length} records.`, 'success');
    };

    return {
        editingId, editFormData, isAddFormVisible, newCertificateData, isAdding, flashId, deletingId, generatingPdfId, generatingPdfV1Id, isBulkGeneratingV1, isBulkGeneratingV2,
        setEditingId, setEditFormData, setIsAddFormVisible, setNewCertificateData, setFlashId,
        handleSelectOne, handleSelectAll, handleBulkDelete, handleEdit, handleSave, handleDelete, handleChange, handleAddCertificate, handleNewCertChange, 
        handleDownload, 
        handleGeneratePDF_V1, 
        handleGeneratePDF_V2, 
        handleBulkGeneratePDF_V1, 
        handleBulkGeneratePDF_V2, 
        handleRestrictedAdminNotify 
    };
};