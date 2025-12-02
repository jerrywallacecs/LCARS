import React, { useState, useEffect, useRef } from 'react';

const FileExplorer = () => {
  const [currentPath, setCurrentPath] = useState('C:\\');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pathHistory, setPathHistory] = useState(['C:\\']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [error, setError] = useState(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [showNewItemDialog, setShowNewItemDialog] = useState(false);
  const [newItemType, setNewItemType] = useState('folder'); // 'folder' or 'file'
  const [newItemName, setNewItemName] = useState('');
  const [showPropertiesDialog, setShowPropertiesDialog] = useState(false);
  const [itemProperties, setItemProperties] = useState(null);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'size', 'modified', 'type'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  
  const contextMenuRef = useRef(null);
  const newItemInputRef = useRef(null);
  const renameInputRef = useRef(null);
  const searchInputRef = useRef(null);

  // Load directory contents
  const loadDirectory = async (path) => {
    if (!window.electronAPI) return;
    
    setLoading(true);
    setError(null);
    setSelectedItem(null);
    
    try {
      const result = await window.electronAPI.readDirectory(path);
      if (result.success) {
        setItems(result.items);
        setCurrentPath(path);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error loading directory:', error);
      setError('Failed to load directory');
    } finally {
      setLoading(false);
    }
  };

  // Navigate to a path
  const navigateTo = async (path) => {
    if (path === currentPath) return;
    
    // Update history
    const newHistory = pathHistory.slice(0, historyIndex + 1);
    newHistory.push(path);
    setPathHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    await loadDirectory(path);
  };

  // Go back in history
  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      loadDirectory(pathHistory[newIndex]);
    }
  };

  // Go forward in history
  const goForward = () => {
    if (historyIndex < pathHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      loadDirectory(pathHistory[newIndex]);
    }
  };

  // Go up one directory
  const goUp = () => {
    const parentPath = currentPath.split('\\').slice(0, -1).join('\\');
    if (parentPath && parentPath !== currentPath) {
      navigateTo(parentPath + (parentPath.endsWith(':') ? '\\' : ''));
    }
  };

  // Handle item double click
  const handleItemDoubleClick = async (item) => {
    if (item.type === 'directory') {
      await navigateTo(item.path);
    } else {
      // Try to open the file
      try {
        const result = await window.electronAPI.openFile(item.path);
        if (!result.success) {
          setError(`Failed to open file: ${result.error}`);
        }
      } catch (error) {
        setError('Failed to open file');
      }
    }
  };

  // Handle item click
  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  // Handle right-click context menu
  const handleContextMenu = (e, item = null) => {
    e.preventDefault();
    setSelectedItem(item);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // Create new item (folder or file)
  const createNewItem = async () => {
    if (!newItemName.trim()) return;
    
    const newPath = `${currentPath}${currentPath.endsWith('\\') ? '' : '\\'}${newItemName}`;
    
    try {
      const result = newItemType === 'folder' 
        ? await window.electronAPI.createDirectory(newPath)
        : await window.electronAPI.createFile(newPath);
      
      if (result.success) {
        await loadDirectory(currentPath);
        setShowNewItemDialog(false);
        setNewItemName('');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(`Failed to create ${newItemType}`);
    }
  };

  // Delete item
  const deleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) return;
    
    try {
      const result = item.type === 'directory'
        ? await window.electronAPI.deleteDirectory(item.path)
        : await window.electronAPI.deleteFile(item.path);
      
      if (result.success) {
        await loadDirectory(currentPath);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(`Failed to delete ${item.type}`);
    }
  };

  // Rename item
  const renameItem = async () => {
    if (!renameValue.trim() || !selectedItem) return;
    
    const newPath = `${currentPath}${currentPath.endsWith('\\') ? '' : '\\'}${renameValue}`;
    
    try {
      const result = await window.electronAPI.renameItem(selectedItem.path, newPath);
      if (result.success) {
        await loadDirectory(currentPath);
        setShowRenameDialog(false);
        setRenameValue('');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to rename item');
    }
  };

  // Get item properties
  const showProperties = async (item) => {
    try {
      const result = await window.electronAPI.getItemProperties(item.path);
      if (result.success) {
        setItemProperties(result.properties);
        setShowPropertiesDialog(true);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to get item properties');
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (item) => {
    try {
      const result = await window.electronAPI.copyToClipboard(item.path);
      if (!result.success) {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to copy to clipboard');
    }
  };

  // Paste from clipboard
  const pasteFromClipboard = async () => {
    try {
      const result = await window.electronAPI.pasteFromClipboard(currentPath);
      if (result.success) {
        await loadDirectory(currentPath);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to paste from clipboard');
    }
  };

  // Sort items
  const sortItems = React.useCallback((itemsToSort) => {
    return [...itemsToSort].sort((a, b) => {
      let aVal, bVal;
      
      // Directories first
      if (a.type !== b.type) {
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;
      }
      
      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'size':
          aVal = a.size || 0;
          bVal = b.size || 0;
          break;
        case 'modified':
          aVal = new Date(a.modified);
          bVal = new Date(b.modified);
          break;
        case 'type':
          aVal = a.extension || '';
          bVal = b.extension || '';
          break;
        default:
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      } else {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
    });
  }, [sortBy, sortOrder]);

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Get file icon
  const getFileIcon = (item) => {
    if (item.type === 'directory') return '📁';
    
    const ext = item.extension?.toLowerCase();
    const iconMap = {
      '.txt': '📄',
      '.doc': '📄',
      '.docx': '📄',
      '.pdf': '📄',
      '.xls': '📊',
      '.xlsx': '📊',
      '.ppt': '📊',
      '.pptx': '📊',
      '.jpg': '🖼️',
      '.jpeg': '🖼️',
      '.png': '🖼️',
      '.gif': '🖼️',
      '.bmp': '🖼️',
      '.mp3': '🎵',
      '.wav': '🎵',
      '.mp4': '🎬',
      '.avi': '🎬',
      '.mkv': '🎬',
      '.zip': '📦',
      '.rar': '📦',
      '.7z': '📦',
      '.js': '📄',
      '.html': '📄',
      '.css': '📄',
      '.json': '📄',
      '.exe': '⚙️'
    };
    
    return iconMap[ext] || '📄';
  };

  // Filter items based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredItems(sortItems(items));
    } else {
      const filtered = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(sortItems(filtered));
    }
  }, [items, searchTerm, sortItems]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setShowContextMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load initial directory
  useEffect(() => {
    loadDirectory('C:\\');
  }, []); // Only run once on mount

  // Focus inputs when dialogs open
  useEffect(() => {
    if (showNewItemDialog && newItemInputRef.current) {
      newItemInputRef.current.focus();
    }
  }, [showNewItemDialog]);

  useEffect(() => {
    if (showRenameDialog && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [showRenameDialog]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .file-explorer {
          background: #1a1a1a;
          color: var(--font-color);
        }
        .file-explorer-toolbar {
          background: rgba(0, 0, 0, 0.4);
          border-bottom: 2px solid var(--orange);
        }
        .file-explorer-button {
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid var(--orange);
          color: var(--orange);
          transition: all 0.3s ease;
        }
        .file-explorer-button:hover:not(:disabled) {
          background: rgba(255, 153, 0, 0.2);
          border-color: var(--butterscotch);
          color: var(--butterscotch);
        }
        .file-explorer-button:disabled {
          background: rgba(0, 0, 0, 0.2);
          border-color: #666;
          color: #666;
          cursor: not-allowed;
        }
        .file-explorer-select {
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid var(--orange);
          color: var(--orange);
          padding: 0.25rem;
        }
        .file-explorer-select option {
          background: black;
          color: var(--orange);
        }
        .file-explorer-breadcrumb {
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid var(--orange);
          color: var(--orange);
          border-radius: 3px;
          transition: all 0.3s ease;
        }
        .file-explorer-breadcrumb:hover {
          background: rgba(255, 153, 0, 0.2);
          color: var(--butterscotch);
        }
        .file-explorer-search {
          background: rgba(0, 0, 0, 0.4);
          border-bottom: 1px solid var(--orange);
        }
        .file-explorer-search input {
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid var(--orange);
          color: var(--space-white);
          border-radius: 3px;
        }
        .file-explorer-search input::placeholder {
          color: #1a1a1a;
        }
        .file-explorer-list {
          background: rgba(0, 0, 0, 0.3);
          color: var(--space-white);
        }
        .file-item {
          border-bottom: 1px solid rgba(255, 153, 0, 0.2);
          transition: all 0.3s ease;
        }
        .file-item:hover {
          background: rgba(255, 153, 0, 0.1);
        }
        .file-item.selected {
          background: rgba(255, 153, 0, 0.3);
          border-left: 3px solid var(--orange);
        }
        .context-menu {
          background: rgba(0, 0, 0, 0.9);
          border: 2px solid var(--orange);
          color: var(--space-white);
          border-radius: 0 8px 0 0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }
        .context-menu-item {
          border-bottom: 1px solid rgba(255, 153, 0, 0.3);
          transition: all 0.3s ease;
        }
        .context-menu-item:hover {
          background: rgba(255, 153, 0, 0.2);
          color: var(--butterscotch);
        }
        .dialog {
          background: rgba(0, 0, 0, 0.9);
          color: var(--space-white);
          border: 2px solid var(--orange);
          border-radius: 0 12px 0 0;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.7);
        }
        .dialog h3 {
          color: var(--orange);
          border-bottom: 1px solid var(--orange);
          padding-bottom: 0.5rem;
          margin-bottom: 1rem;
        }
        .dialog input, .dialog select {
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid var(--orange);
          color: var(--space-white);
          border-radius: 3px;
        }
        .dialog input:focus, .dialog select:focus {
          outline: none;
          border-color: var(--butterscotch);
          box-shadow: 0 0 5px rgba(255, 153, 0, 0.3);
        }
        .dialog-button {
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid var(--orange);
          color: var(--orange);
          border-radius: 3px;
          transition: all 0.3s ease;
        }
        .dialog-button:hover {
          background: rgba(255, 153, 0, 0.2);
          color: var(--butterscotch);
        }
        .dialog-button.primary {
          background: var(--orange);
          color: black;
        }
        .dialog-button.primary:hover {
          background: var(--butterscotch);
        }
        .error-message {
          background: rgba(139, 0, 0, 0.8);
          border: 1px solid var(--red);
          color: var(--space-white);
          border-radius: 0 8px 0 0;
        }
        .loading-message {
          color: var(--orange);
          text-align: center;
          font-weight: bold;
        }
      `}</style>
      
      {/* Toolbar */}
      <div className="file-explorer-toolbar" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0.5rem', 
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        {/* Navigation buttons */}
        <button 
          onClick={goBack} 
          disabled={historyIndex <= 0}
          className="file-explorer-button"
          style={{ 
            padding: '0.25rem 0.5rem'
          }}
        >
          ← Back
        </button>
        <button 
          onClick={goForward} 
          disabled={historyIndex >= pathHistory.length - 1}
          className="file-explorer-button"
          style={{ 
            padding: '0.25rem 0.5rem'
          }}
        >
          Forward →
        </button>
        <button 
          onClick={goUp} 
          className="file-explorer-button"
          style={{ 
            padding: '0.25rem 0.5rem'
          }}
        >
          ↑ Up
        </button>
        
        {/* Path breadcrumb */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {currentPath.split('\\').filter(part => part).map((part, index, array) => (
            <React.Fragment key={index}>
              <span 
                onClick={() => {
                  const path = array.slice(0, index + 1).join('\\') + (index === 0 ? '\\' : '');
                  navigateTo(path);
                }}
                className="file-explorer-breadcrumb"
                style={{ 
                  cursor: 'pointer', 
                  padding: '0.25rem'
                }}
              >
                {part}
              </span>
              {index < array.length - 1 && <span style={{ color: 'var(--orange)' }}>\\</span>}
            </React.Fragment>
          ))}
        </div>

        {/* View controls */}
        <select 
          value={viewMode} 
          onChange={(e) => setViewMode(e.target.value)}
          className="file-explorer-select"
        >
          <option value="list">List</option>
          <option value="grid">Grid</option>
        </select>
        
        <select 
          value={`${sortBy}-${sortOrder}`} 
          onChange={(e) => {
            const [newSortBy, newSortOrder] = e.target.value.split('-');
            setSortBy(newSortBy);
            setSortOrder(newSortOrder);
          }}
          className="file-explorer-select"
        >
          <option value="name-asc">Name ↑</option>
          <option value="name-desc">Name ↓</option>
          <option value="size-asc">Size ↑</option>
          <option value="size-desc">Size ↓</option>
          <option value="modified-asc">Modified ↑</option>
          <option value="modified-desc">Modified ↓</option>
          <option value="type-asc">Type ↑</option>
          <option value="type-desc">Type ↓</option>
        </select>

        {/* New item button */}
        <button 
          onClick={() => setShowNewItemDialog(true)}
          className="file-explorer-button"
          style={{ 
            padding: '0.25rem 0.5rem'
          }}
        >
          + New
        </button>
      </div>

      {/* Search bar */}
      <div className="file-explorer-search" style={{ 
        padding: '0.5rem'
      }}>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search files and folders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            color: 'var(--h1-color)',
            width: '100%', 
            padding: '0.5rem'
          }}
        />
      </div>

      {/* File list */}
      <div 
        className="file-explorer-list"
        style={{ 
          flex: 1, 
          overflow: 'auto',
          position: 'relative'
        }}
        onContextMenu={(e) => handleContextMenu(e)}
      >
        {loading && (
          <div className="loading-message" style={{ 
            padding: '2rem'
          }}>
            LOADING DIRECTORY...
          </div>
        )}
        
        {error && (
          <div className="error-message" style={{ 
            padding: '1rem',
            margin: '0.5rem'
          }}>
            ERROR: {error}
          </div>
        )}
        
        {!loading && !error && (
          <div style={{ 
            display: viewMode === 'grid' ? 'grid' : 'block',
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(120px, 1fr))' : 'none',
            gap: viewMode === 'grid' ? '0.5rem' : '0',
            padding: '0.5rem'
          }}>
            {filteredItems.map((item, index) => (
              <div
                key={index}
                onClick={() => handleItemClick(item)}
                onDoubleClick={() => handleItemDoubleClick(item)}
                onContextMenu={(e) => handleContextMenu(e, item)}
                className={`file-item ${selectedItem === item ? 'selected' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  borderRadius: '3px',
                  flexDirection: viewMode === 'grid' ? 'column' : 'row',
                  textAlign: viewMode === 'grid' ? 'center' : 'left',
                  minHeight: viewMode === 'grid' ? '80px' : 'auto'
                }}
              >
                <span style={{ 
                  fontSize: viewMode === 'grid' ? '2rem' : '1.2rem', 
                  marginRight: viewMode === 'grid' ? '0' : '0.5rem',
                  marginBottom: viewMode === 'grid' ? '0.25rem' : '0'
                }}>
                  {getFileIcon(item)}
                </span>
                <div style={{ 
                  flex: 1, 
                  minWidth: 0,
                  width: viewMode === 'grid' ? '100%' : 'auto'
                }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: viewMode === 'grid' ? '0.8rem' : '0.9rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: viewMode === 'grid' ? 'normal' : 'nowrap'
                  }}>
                    {item.name}
                  </div>
                  {viewMode === 'list' && (
                    <div style={{ 
                      fontSize: '0.7rem', 
                      color: 'rgba(255, 255, 255, 0.7)',
                      display: 'flex',
                      gap: '1rem'
                    }}>
                      <span>{item.type === 'directory' ? 'Folder' : formatFileSize(item.size)}</span>
                      <span>{new Date(item.modified).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenuPos.y,
            left: contextMenuPos.x,
            padding: '0.25rem',
            zIndex: 1000,
            minWidth: '120px'
          }}
        >
          {selectedItem ? (
            <>
              <div 
                onClick={() => handleItemDoubleClick(selectedItem)}
                className="context-menu-item"
                style={{ padding: '0.5rem', cursor: 'pointer' }}
              >
                Open
              </div>
              <div 
                onClick={() => {
                  setRenameValue(selectedItem.name);
                  setShowRenameDialog(true);
                  setShowContextMenu(false);
                }}
                className="context-menu-item"
                style={{ padding: '0.5rem', cursor: 'pointer' }}
              >
                Rename
              </div>
              <div 
                onClick={() => {
                  copyToClipboard(selectedItem);
                  setShowContextMenu(false);
                }}
                className="context-menu-item"
                style={{ padding: '0.5rem', cursor: 'pointer' }}
              >
                Copy
              </div>
              <div 
                onClick={() => {
                  deleteItem(selectedItem);
                  setShowContextMenu(false);
                }}
                className="context-menu-item"
                style={{ padding: '0.5rem', cursor: 'pointer' }}
              >
                Delete
              </div>
              <div 
                onClick={() => {
                  showProperties(selectedItem);
                  setShowContextMenu(false);
                }}
                className="context-menu-item"
                style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: 'none' }}
              >
                Properties
              </div>
            </>
          ) : (
            <>
              <div 
                onClick={() => {
                  setNewItemType('folder');
                  setShowNewItemDialog(true);
                  setShowContextMenu(false);
                }}
                className="context-menu-item"
                style={{ padding: '0.5rem', cursor: 'pointer' }}
              >
                New Folder
              </div>
              <div 
                onClick={() => {
                  setNewItemType('file');
                  setShowNewItemDialog(true);
                  setShowContextMenu(false);
                }}
                className="context-menu-item"
                style={{ padding: '0.5rem', cursor: 'pointer' }}
              >
                New File
              </div>
              <div 
                onClick={() => {
                  pasteFromClipboard();
                  setShowContextMenu(false);
                }}
                className="context-menu-item"
                style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: 'none' }}
              >
                Paste
              </div>
            </>
          )}
        </div>
      )}

      {/* New Item Dialog */}
      {showNewItemDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div className="dialog" style={{
            padding: '2rem',
            minWidth: '300px'
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Create New {newItemType}</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'var(--orange)' }}>Type:</label>
              <select 
                value={newItemType} 
                onChange={(e) => setNewItemType(e.target.value)}
                style={{ 
                  marginLeft: '0.5rem', 
                  padding: '0.25rem'
                }}
              >
                <option value="folder">Folder</option>
                <option value="file">File</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'var(--orange)' }}>Name:</label>
              <input
                ref={newItemInputRef}
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createNewItem()}
                style={{ 
                  marginLeft: '0.5rem', 
                  padding: '0.5rem',
                  flex: 1
                }}
                placeholder={`Enter ${newItemType} name`}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  setShowNewItemDialog(false);
                  setNewItemName('');
                }}
                className="dialog-button"
                style={{
                  padding: '0.5rem 1rem'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={createNewItem}
                className="dialog-button primary"
                style={{
                  padding: '0.5rem 1rem'
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Dialog */}
      {showRenameDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div className="dialog" style={{
            padding: '2rem',
            minWidth: '300px'
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Rename Item</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'var(--orange)' }}>New name:</label>
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && renameItem()}
                style={{ 
                  marginLeft: '0.5rem', 
                  padding: '0.5rem',
                  width: '200px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  setShowRenameDialog(false);
                  setRenameValue('');
                }}
                className="dialog-button"
                style={{
                  padding: '0.5rem 1rem'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={renameItem}
                className="dialog-button primary"
                style={{
                  padding: '0.5rem 1rem'
                }}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Properties Dialog */}
      {showPropertiesDialog && itemProperties && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div className="dialog" style={{
            padding: '2rem',
            minWidth: '400px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Properties - {itemProperties.name}</h3>
            <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
              <div><strong style={{ color: 'var(--orange)' }}>Name:</strong> <span style={{ color: 'var(--space-white)' }}>{itemProperties.name}</span></div>
              <div><strong style={{ color: 'var(--orange)' }}>Path:</strong> <span style={{ color: 'var(--space-white)' }}>{itemProperties.path}</span></div>
              <div><strong style={{ color: 'var(--orange)' }}>Type:</strong> <span style={{ color: 'var(--space-white)' }}>{itemProperties.type}</span></div>
              <div><strong style={{ color: 'var(--orange)' }}>Size:</strong> <span style={{ color: 'var(--space-white)' }}>{formatFileSize(itemProperties.size)}</span></div>
              <div><strong style={{ color: 'var(--orange)' }}>Created:</strong> <span style={{ color: 'var(--space-white)' }}>{new Date(itemProperties.created).toLocaleString()}</span></div>
              <div><strong style={{ color: 'var(--orange)' }}>Modified:</strong> <span style={{ color: 'var(--space-white)' }}>{new Date(itemProperties.modified).toLocaleString()}</span></div>
              <div><strong style={{ color: 'var(--orange)' }}>Accessed:</strong> <span style={{ color: 'var(--space-white)' }}>{new Date(itemProperties.accessed).toLocaleString()}</span></div>
              <div><strong style={{ color: 'var(--orange)' }}>Attributes:</strong> <span style={{ color: 'var(--space-white)' }}>{itemProperties.attributes?.join(', ') || 'None'}</span></div>
              {itemProperties.type === 'directory' && (
                <div><strong style={{ color: 'var(--orange)' }}>Items:</strong> <span style={{ color: 'var(--space-white)' }}>{itemProperties.itemCount || 0}</span></div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button 
                onClick={() => setShowPropertiesDialog(false)}
                className="dialog-button primary"
                style={{
                  padding: '0.5rem 1rem'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;