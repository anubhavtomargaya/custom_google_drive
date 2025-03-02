"use client";
import { useState, useEffect } from 'react';
import { 
  FaFolder, 
  FaFileImage, 
  FaFilePdf, 
  FaFileWord, 
  FaFileExcel, 
  FaFilePowerpoint, 
  FaFileAudio, 
  FaFileVideo, 
  FaFileArchive, 
  FaFile,
  FaDownload,
  FaCopy,
  FaTrash,
  FaUpload,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaPlay
} from 'react-icons/fa';
import Link from 'next/link';
import FilePreviewSidebar from '../components/FilePreviewSidebar';
import { getFileType } from '../app/utils/fileHandler';
import FolderSelector from '@/components/FolderSelector';
import BulkUploader from '@/components/BulkUploader';
import FloatingUploadPanel from '@/components/FloatingUploadPanel';

export interface FileSystemItem {
  name: string;
  type: 'folder' | 'file';
  size: string;
  updated: string;
  children?: { [key: string]: FileSystemItem };
  metadata?: FileMetadata;
}

export interface FileMetadata {
  name: string;
  bucket: string;
  generation: string;
  metageneration: string;
  contentType: string;
  storageClass: string;
  size: string;
  md5Hash: string;
  crc32c: string;
  etag: string;
  timeCreated: string;
  updated: string;
  timeStorageClassUpdated: string;
  timeFinalized: string;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileSystemItem | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc' | null;
  }>({ key: '', direction: null });
  const [currentPath, setCurrentPath] = useState<string>('');
  const [folders, setFolders] = useState<Array<{
    name: string;
    size: string;
    updated: string;
  }>>([]);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [fileContent, setFileContent] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [fileStructure, setFileStructure] = useState<{ [key: string]: FileSystemItem }>({});
  const [currentItems, setCurrentItems] = useState<FileSystemItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    url: string;
    type: string;
    fileName: string;
  }>({
    isOpen: false,
    url: '',
    type: '',
    fileName: ''
  });
  const [selectedUploadFolder, setSelectedUploadFolder] = useState('');
  const [isBulkUploadVisible, setIsBulkUploadVisible] = useState(false);
  const [isPollingActive, setIsPollingActive] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Update useEffect to fetch data when path changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pathFromUrl = params.get('path') || '';
    setCurrentPath(pathFromUrl);

    const fetchData = async () => {
      try {
        // Determine if the path points to a file
        const isFile = pathFromUrl.includes('.');
        const endpoint = '/api/folders';
        
        const response = await fetch(`${endpoint}?prefix=${encodeURIComponent(pathFromUrl)}`);
        const data = await response.json();

        if (isFile) {
          setFileContent(data);
          setIsFileModalOpen(true);
        } else {
          setFolders(data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // You might want to add error state handling here
      }
    };

    fetchData();
  }, [currentPath]);

  // Close preview when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.getElementById('file-preview-sidebar');
      if (sidebar && !sidebar.contains(e.target as Node)) {
        setSelectedFile(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sorting function
  const sortItems = (items: typeof folders) => {
    if (!sortConfig.key || !sortConfig.direction) return items;

    return [...items].sort((a, b) => {
      if (a[sortConfig.key as keyof typeof a] < b[sortConfig.key as keyof typeof b]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
        
      }
      if (a[sortConfig.key as keyof typeof a] > b[sortConfig.key as keyof typeof b]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Request sort function
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }
    
    setSortConfig({ key, direction });
  };

  // Get sort icon
  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return <FaSort className="ml-2 inline-block opacity-30" />;
    }
    if (sortConfig.direction === 'asc') {
      return <FaSortUp className="ml-2 inline-block" />;
    }
    if (sortConfig.direction === 'desc') {
      return <FaSortDown className="ml-2 inline-block" />;
    }
    return <FaSort className="ml-2 inline-block opacity-30" />;
  };

  // Filter and sort folders
  const filteredAndSortedFolders = sortItems(
    folders.filter(folder =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Update pagination to use sorted items
  const totalPages = Math.ceil(filteredAndSortedFolders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFolders = filteredAndSortedFolders.slice(startIndex, startIndex + itemsPerPage);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Update URL with page number
    const url = new URL(window.location.href);
    url.searchParams.set('page', page.toString());
    window.history.pushState({}, '', url);
  };

  const getFileIcon = (fileName: string, isFolder: boolean) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    // If no extension, assume it's a folder
    if (!extension || fileName.indexOf('.') === -1) {
      return <FaFolder className="text-yellow-500 text-xl" />;
    }

    // Map extensions to icons
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <FaFileImage className="text-blue-500 text-xl" />;
      case 'pdf':
        return <FaFilePdf className="text-red-500 text-xl" />;
      case 'doc':
      case 'docx':
        return <FaFileWord className="text-blue-600 text-xl" />;
      case 'xls':
      case 'xlsx':
        return <FaFileExcel className="text-green-600 text-xl" />;
      case 'ppt':
      case 'pptx':
        return <FaFilePowerpoint className="text-orange-600 text-xl" />;
      case 'mp3':
      case 'wav':
        return <FaFileAudio className="text-purple-500 text-xl" />;
      case 'mp4':
      case 'mov':
      case 'avi':
        return <FaFileVideo className="text-indigo-500 text-xl" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <FaFileArchive className="text-gray-500 text-xl" />;
      default:
        return <FaFile className="text-gray-400 text-xl" />;
    }
  };

  // Generate breadcrumbs from currentPath
  const getBreadcrumbs = () => {
    const parts = currentPath.split('/').filter(Boolean);
    return [
      { name: 'Home', path: '' },
      ...parts.map((part, index) => ({
        name: part,
        path: parts.slice(0, index + 1).join('/')
      }))
    ];
  };

  // Add File Modal component
  const FileModal = () => (
    <dialog id="file_modal" className={`modal ${isFileModalOpen ? 'modal-open' : ''}`}>
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">File Preview</h3>
        <div className="max-h-96 overflow-auto">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(fileContent, null, 2)}
          </pre>
        </div>
        <div className="modal-action">
          <button 
            className="btn"
            onClick={() => setIsFileModalOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={() => setIsFileModalOpen(false)}>close</button>
      </form>
    </dialog>
  );

  // Fetch file structure data
  useEffect(() => {
    const fetchFileStructure = async () => {
      try {
        const response = await fetch('/api/file-structure');
        const data = await response.json();
        setFileStructure(data);
        
        // Set initial items based on current path
        updateCurrentItems(data, currentPath);
      } catch (error) {
        console.error('Error fetching file structure:', error);
      }
    };

    fetchFileStructure();
  }, []);

  // Update displayed items when path changes
  useEffect(() => {
    updateCurrentItems(fileStructure, currentPath);
  }, [currentPath, fileStructure]);

  const updateCurrentItems = (structure: typeof fileStructure, path: string) => {
    let current = structure;
    const pathParts = path.split('/').filter(Boolean);
    
    // Navigate to current folder
    for (const part of pathParts) {
      if (current[part]?.children) {
        current = current[part].children!;
      } else {
        break;
      }
    }

    // Convert current level object to array
    const items = Object.entries(current).map(([key, value]) => ({
      ...value,
      name: key
    }));

    setCurrentItems(items);
  };

  const handleItemClick = (item: FileSystemItem) => {
    if (item.type === 'folder') {
      const newPath = currentPath 
        ? `${currentPath}/${item.name}`
        : item.name;
      
      setCurrentPath(newPath);
      const url = new URL(window.location.href);
      url.searchParams.set('path', newPath);
      window.history.pushState({}, '', url);
    } else {
      setSelectedFile(item as FileSystemItem);
    }
  };

  const handleDownload = async (folder: typeof folders[0]) => {
    try {
      const filePath = currentPath 
        ? `${currentPath}/${folder.name}`
        : folder.name;
        
      const response = await fetch(`/api/download?path=${encodeURIComponent(filePath)}`);
      const data = await response.json();
      
      if (data.url) {
        // Open the signed URL in a new tab or trigger download
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    const urlInput = form.querySelector('input[name="httpUrl"]') as HTMLInputElement;
    
    let targetFolder = selectedUploadFolder || '';
    
    // Check if we're uploading via URL or file
    if (urlInput.value) {
      try {
        setIsUploading(true);
        const response = await fetch('/api/transfer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceUrl: urlInput.value,
            folderName: targetFolder,
          }),
        });

        if (!response.ok) {
          throw new Error('Transfer request failed');
        }

        const data = await response.json();
        console.log('Transfer initiated:', data);
        setIsUploadModalOpen(false);
      } catch (error) {
        console.error('Transfer failed:', error);
        alert(`Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // File upload logic
    if (!fileInput.files?.length) {
      alert('Please select a file or provide an HTTP URL');
      return;
    }

    const file = fileInput.files[0];
    
    try {
      setIsUploading(true);
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderName', targetFolder);
      
      // Track upload progress with XHR
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload-proxy');
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(Math.round(progress));
        }
      };
      
      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('Upload completed successfully');
          // Refresh file structure
          const response = await fetch('/api/file-structure');
          const data = await response.json();
          setFileStructure(data);
          updateCurrentItems(data, currentPath);
          setIsUploadModalOpen(false);
        } else {
          console.error('Upload failed:', xhr.responseText);
          alert(`Upload failed: ${xhr.statusText}`);
        }
        setIsUploading(false);
      };
      
      xhr.onerror = () => {
        console.error('Upload request failed');
        alert('Upload failed due to a network error');
        setIsUploading(false);
      };
      
      xhr.send(formData);
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsUploading(false);
    }
  };

  const handleFilePreview = async (
    item: FileSystemItem, 
    currentPath: string, 
    onPreviewOpen: (url: string, type: string) => void
  ) => {
    try {
      const filePath = currentPath 
        ? `${currentPath}/${item.name}`
        : item.name;
      
      const response = await fetch(`/api/download?path=${encodeURIComponent(filePath)}`);
      const data = await response.json();
      
      if (data.url) {
        const fileType = getFileType(item.name);
        onPreviewOpen(data.url, fileType);
      }
    } catch (error) {
      console.error('Error getting file preview:', error);
    }
  };

  const handleDelete = async (item: FileSystemItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      const filePath = currentPath 
        ? `${currentPath}/${item.name}`
        : item.name;
      console.log('Deleting file:', filePath);
      const response = await fetch(`/api/${filePath}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      // Refresh the current items list
      const fetchFileStructure = async () => {
        const response = await fetch('/api/file-structure');
        const data = await response.json();
        setFileStructure(data);
        updateCurrentItems(data, currentPath);
      };

      await fetchFileStructure();
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  // Inside your component, add this log
  useEffect(() => {
    console.log('Selected upload folder:', selectedUploadFolder);
  }, [selectedUploadFolder]);

  const refreshFileStructure = async () => {
    try {
      console.log('Refreshing file structure...');
      const response = await fetch('/api/file-structure');
      const data = await response.json();
      setFileStructure(data);
      updateCurrentItems(data, currentPath);
      console.log('File structure refreshed successfully');
    } catch (error) {
      console.error('Error refreshing file structure:', error);
    }
  };

  // Set up polling when uploads are in progress
  useEffect(() => {
    if (!isPollingActive) return;
    
    const pollInterval = setInterval(() => {
      refreshFileStructure();
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(pollInterval);
  }, [isPollingActive]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-earth-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sage-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sage-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const handlePathChange = (path: string) => {
    // Update the current path state
    setCurrentPath(path);
    
    // Update the URL query parameter
    const url = new URL(window.location.href);
    if (path) {
      url.searchParams.set('path', path);
    } else {
      url.searchParams.delete('path');
    }
    window.history.pushState({}, '', url);
    
    // If fileStructure is available, update the displayed items
    if (fileStructure) {
      updateCurrentItems(fileStructure, path);
    }
  };

  return (
    <div className="flex h-screen bg-earth-50">
      <div className="flex-1 p-2 sm:p-6 flex flex-col">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-medium text-earth-800">File Manager</h1>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-earth-200 rounded-lg text-sm text-earth-700 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-earth-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <button
              onClick={() => {
                setSelectedUploadFolder(currentPath);
                setIsBulkUploadVisible(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-sage-500 hover:bg-sage-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Upload</span>
            </button>
          </div>
        </div>
        
        {/* Breadcrumb navigation */}
        <div className="flex items-center space-x-2 mb-4 text-sm overflow-x-auto pb-2">
          <button
            onClick={() => handlePathChange('')}
            className={`px-2 py-1 rounded ${currentPath === '' ? 'bg-sage-100 text-sage-700' : 'text-earth-600 hover:bg-earth-100'} transition-colors`}
          >
            Home
          </button>
          
          {/* Render breadcrumb segments */}
          {currentPath !== '' && currentPath.split('/').map((segment, index, array) => {
            const path = array.slice(0, index + 1).join('/');
            return (
              <div key={path} className="flex items-center">
                <span className="text-earth-400 mx-1">/</span>
                <button
                  onClick={() => handlePathChange(path)}
                  className={`px-2 py-1 rounded ${
                    index === array.length - 1 
                      ? 'bg-sage-100 text-sage-700' 
                      : 'text-earth-600 hover:bg-earth-100'
                  } transition-colors`}
                >
                  {segment}
                </button>
              </div>
            );
          })}
        </div>
        
        {/* File and folder listing */}
        <div className="bg-white rounded-xl border border-earth-100 shadow-soft flex-1 overflow-hidden">
          {/* Table header */}
          <div className="border-b border-earth-100">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-earth-700">
              <div className="col-span-6 flex items-center">
                <button 
                  onClick={() => handleSort('name')}
                  className="flex items-center space-x-1 hover:text-sage-600 transition-colors"
                >
                  <span>Name</span>
                  {renderSortIcon('name')}
                </button>
              </div>
              <div className="col-span-2 flex items-center">
                <button 
                  onClick={() => handleSort('size')}
                  className="flex items-center space-x-1 hover:text-sage-600 transition-colors"
                >
                  <span>Size</span>
                  {renderSortIcon('size')}
                </button>
              </div>
              <div className="col-span-3 flex items-center">
                <button 
                  onClick={() => handleSort('updated')}
                  className="flex items-center space-x-1 hover:text-sage-600 transition-colors"
                >
                  <span>Last Modified</span>
                  {renderSortIcon('updated')}
                </button>
              </div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
          </div>
          
          {/* File and folder items */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
            {currentItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-earth-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium mb-1">This folder is empty</p>
                <p className="text-sm">Upload files or create folders to get started</p>
              </div>
            ) : (
              currentItems.map((item, index) => (
                <div 
                  key={index} 
                  className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-earth-100 hover:bg-earth-50 transition-colors"
                >
                  <div className="col-span-6 flex items-center">
                    <div 
                      onClick={() => handleItemClick(item)}
                      className="flex items-center cursor-pointer"
                    >
                      {item.type === 'folder' ? (
                        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-sage-100 text-sage-600 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-earth-100 text-earth-600 mr-3">
                          {getFileIcon(item.name)}
                        </div>
                      )}
                      <span className="text-sm text-earth-800 truncate">{item.name}</span>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center text-sm text-earth-600">
                    {item.size || '-'}
                  </div>
                  <div className="col-span-3 flex items-center text-sm text-earth-600">
                    {item.updated || '-'}
                  </div>
                  <div className="col-span-1 flex items-center justify-end space-x-1">
                    {item.type === 'file' && (
                      <>
                        <button
                          onClick={() => handleDownload(item)}
                          className="p-1.5 rounded-lg hover:bg-earth-100 text-earth-500 transition-colors"
                          title="Download"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handlePreview(item)}
                          className="p-1.5 rounded-lg hover:bg-earth-100 text-earth-500 transition-colors"
                          title="Preview"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 rounded-lg hover:bg-clay-100 text-clay-500 transition-colors"
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-earth-600">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, currentItems.length)} to {Math.min(currentPage * itemsPerPage, currentItems.length)} of {currentItems.length} items
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg bg-white border border-earth-200 text-earth-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage * itemsPerPage >= currentItems.length}
              className="px-3 py-1 rounded-lg bg-white border border-earth-200 text-earth-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      
      {/* Upload panel */}
      <FloatingUploadPanel
        isOpen={isBulkUploadVisible}
        onClose={() => {
          setIsBulkUploadVisible(false);
          setIsPollingActive(false);
        }}
        onComplete={() => {
          refreshFileStructure();
          setIsBulkUploadVisible(false);
          setIsPollingActive(false);
        }}
        onUploadStart={() => {
          setIsPollingActive(true);
        }}
      />
      
      {/* Preview modal */}
      <dialog id="preview_modal" className={`modal ${previewModal.isOpen ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-4xl bg-white p-0 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-earth-100 flex justify-between items-center">
            <h3 className="font-medium text-earth-800 truncate">{previewModal.fileName}</h3>
            <button 
              onClick={() => setPreviewModal({
                isOpen: false,
                url: '',
                type: '',
                fileName: ''
              })}
              className="p-1.5 rounded-lg hover:bg-earth-100 text-earth-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6">
            {previewModal.type === 'image' && (
              <img 
                src={previewModal.url} 
                alt={previewModal.fileName} 
                className="max-w-full max-h-[70vh] mx-auto rounded-lg"
              />
            )}
            {previewModal.type === 'video' && (
              <video controls className="w-full max-h-[70vh]">
                <source src={previewModal.url} />
                Your browser does not support the video tag.
              </video>
            )}
            {previewModal.type === 'pdf' && (
              <iframe 
                src={previewModal.url} 
                className="w-full h-[70vh]" 
                title={previewModal.fileName}
              />
            )}
            {previewModal.type === 'audio' && (
              <audio controls className="w-full">
                <source src={previewModal.url} />
                Your browser does not support the audio tag.
              </audio>
            )}
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setPreviewModal({
            isOpen: false,
            url: '',
            type: '',
            fileName: ''
          })}>close</button>
        </form>
      </dialog>
    </div>
  );
}
// Update the PreviewModal component definition
const PreviewModal = ({ 
  previewModal, 
  setPreviewModal 
}: { 
  previewModal: { isOpen: boolean; url: string; type: string; fileName: string; }; 
  setPreviewModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean; url: string; type: string; fileName: string; }>>;
}) => (
  <dialog id="preview_modal" className={`modal ${previewModal.isOpen ? 'modal-open' : ''}`}>
    <div className="modal-box max-w-4xl bg-white p-0 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-earth-100 flex justify-between items-center">
        <h3 className="font-medium text-earth-800 truncate">{previewModal.fileName}</h3>
        <button 
          onClick={() => setPreviewModal({
            isOpen: false,
            url: '',
            type: '',
            fileName: ''
          })}
          className="p-1.5 rounded-lg hover:bg-earth-100 text-earth-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-6">
        {previewModal.type === 'image' && (
          <img 
            src={previewModal.url} 
            alt={previewModal.fileName} 
            className="max-w-full max-h-[70vh] mx-auto rounded-lg"
          />
        )}
        {previewModal.type === 'video' && (
          <video controls className="w-full max-h-[70vh]">
            <source src={previewModal.url} />
            Your browser does not support the video tag.
          </video>
        )}
        {previewModal.type === 'pdf' && (
          <iframe 
            src={previewModal.url} 
            className="w-full h-[70vh]" 
            title={previewModal.fileName}
          />
        )}
        {previewModal.type === 'audio' && (
          <audio controls className="w-full">
            <source src={previewModal.url} />
            Your browser does not support the audio tag.
          </audio>
        )}
      </div>
    </div>
    <form method="dialog" className="modal-backdrop">
      <button onClick={() => setPreviewModal({
        isOpen: false,
        url: '',
        type: '',
        fileName: ''
      })}>close</button>
    </form>
  </dialog>
);
