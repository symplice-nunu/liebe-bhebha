export interface Record {
    id: string;
    name: string;
    singular: string;
    plural: string;
    status: 'Active' | 'Inactive';
    createdAt: Date;
    updatedAt: Date;
  }
  
  export type RecordFormData = Omit<Record, 'id' | 'createdAt' | 'updatedAt'>;