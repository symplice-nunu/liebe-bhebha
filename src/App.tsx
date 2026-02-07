import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Toaster, toast } from 'react-hot-toast';
import { Edit2, Plus, Search } from 'lucide-react';
// import { Trash2 } from 'lucide-react';

interface Record {
  id: string;
  name: string;
  singular: string;
  plural: string;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const App: React.FC = () => {
  const [records, setRecords] = useState<Record[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    singular: '',
    plural: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  // Fetch records from Firestore
  useEffect(() => {
    const q = query(collection(db, 'records'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recordsData: Record[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        recordsData.push({
          id: doc.id,
          name: data.name || '',
          singular: data.singular || '',
          plural: data.plural || '',
          status: data.status || 'Active',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });
      setRecords(recordsData);
    });

    return () => unsubscribe();
  }, []);

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      !searchQuery.trim() ||
      record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.singular.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.plural.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'name' ? value.trim() : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      singular: '',
      plural: '',
      status: 'Active',
    });
    setEditingRecord(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const now = new Date();
      const recordData = {
        ...formData,
        createdAt: editingRecord ? editingRecord.createdAt : now,
        updatedAt: now,
      };

      if (editingRecord) {
        // Update existing record
        await updateDoc(doc(db, 'records', editingRecord.id), recordData);
        toast.success('Record updated successfully');
      } else {
        // Create new record
        await addDoc(collection(db, 'records'), {
          ...recordData,
          createdAt: now,
        });
        toast.success('Record created successfully');
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving record:', error);
      toast.error('Error saving record. Please try again.');
    }
  };

  const handleEdit = (record: Record) => {
    setEditingRecord(record);
    setFormData({
      name: record.name,
      singular: record.singular,
      plural: record.plural,
      status: record.status,
    });
    setShowModal(true);
  };

  // const handleDelete = async (id: string) => {
  //   if (window.confirm('Are you sure you want to delete this record?')) {
  //     try {
  //       await deleteDoc(doc(db, 'records', id));
  //       toast.success('Record deleted successfully');
  //     } catch (error) {
  //       console.error('Error deleting record:', error);
  //       toast.error('Error deleting record');
  //     }
  //   }
  // };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="fixed top-0 inset-x-0 bg-white shadow z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Record Manager</h1>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Add
            </button>
          </div>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by English, singular, or plural..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Active' | 'Inactive')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[140px]"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-48 pb-8">
        {/* Records Table */}
        <div className="m-2 text-sm text-gray-600">
          Showing {filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'}
        </div>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    English
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Singular
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plural
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record, index) => (
                  <tr
                    key={record.id}
                    onClick={() => setSelectedRecord(record)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.singular}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.plural}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(record)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      {/* <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button> */}
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      {records.length === 0
                        ? 'No records found. Click "Add" to create your first record.'
                        : 'No records match your search or filter.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Details Modal */}
      {selectedRecord && (() => {
        const currentIndex = filteredRecords.findIndex((r) => r.id === selectedRecord.id);
        const hasPrev = currentIndex > 0;
        const hasNext = currentIndex < filteredRecords.length - 1 && currentIndex >= 0;
        const recordNum = currentIndex >= 0 ? currentIndex + 1 : 0;
        const totalNum = filteredRecords.length;
        return (
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 overflow-y-auto"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-t-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Record Details</h3>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {recordNum} of {totalNum}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => hasPrev && setSelectedRecord(filteredRecords[currentIndex - 1])}
                    disabled={!hasPrev}
                    className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl bg-white hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-colors"
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => hasNext && setSelectedRecord(filteredRecords[currentIndex + 1])}
                    disabled={!hasNext}
                    className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl bg-white hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-5 sm:py-6 overflow-y-auto max-h-[60vh] sm:max-h-[calc(100vh-20rem)]">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="sm:col-span-2 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <dt className="text-xs font-medium text-blue-600 uppercase tracking-wider">English</dt>
                  <dd className="mt-1.5 text-base font-semibold text-gray-900">{selectedRecord.name}</dd>
                </div>
                <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Singular</dt>
                  <dd className="mt-1.5 text-sm text-gray-900">{selectedRecord.singular || '—'}</dd>
                </div>
                <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Plural</dt>
                  <dd className="mt-1.5 text-sm text-gray-900">{selectedRecord.plural || '—'}</dd>
                </div>
              </dl>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/30 rounded-b-2xl">
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="w-full sm:w-auto px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecord(null);
                    handleEdit(selectedRecord);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingRecord ? 'Edit Word' : 'Add New Word'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    English *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Singular Form 
                  </label>
                  <input
                    type="text"
                    name="singular"
                    value={formData.singular}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter singular form"
                    
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plural Form 
                  </label>
                  <input
                    type="text"
                    name="plural"
                    value={formData.plural}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter plural form"
                    
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingRecord ? 'Update' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;