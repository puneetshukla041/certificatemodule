// D:\ssistudios\ssistudios\components\Certificates\utils\constants.ts

export interface ICertificateClient {
    _id: string;
    certificateNo: string;
    name: string;
    hospital: string;
    doi: string;
    // 💡 NEW: This field tells the frontend if the button is Locked or Unlocked
    isApproved?: boolean; 
}

export interface FetchResponse {
    data: ICertificateClient[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    filters: { hospitals: string[] };
}

export interface CertificateTableProps {
    refreshKey: number;
    onRefresh: (data: ICertificateClient[], totalCount: number, uniqueHospitalsList: string[]) => void;
    onAlert: (message: string, isError: boolean) => void;
}

export type SortKey = keyof ICertificateClient;

export interface SortConfig {
    key: SortKey;
    direction: 'asc' | 'desc';
}

export type NotificationType = "success" | "error" | "info";
export interface NotificationState {
    message: string;
    type: NotificationType;
    active: boolean;
}

export const PAGE_LIMIT = 10;

export const initialNewCertificateState: Omit<ICertificateClient, '_id'> = {
    certificateNo: '',
    name: '',
    hospital: '',
    doi: '',
};

export const CERTIFICATE_TYPES = [
    { label: 'External', value: 'external' },
    { label: 'Internal', value: 'internal' },
];

export const CERTIFICATE_TEMPLATES = {
    external: [
        { label: 'Proctorship', value: 'proctorship', color: 'blue' },
        { label: 'Training', value: 'training', color: 'teal' },
    ],
    internal: [
        { label: 'Employee of Month', value: 'eom', color: 'purple' },
        { label: 'Others', value: 'others', color: 'amber' },
    ],
};