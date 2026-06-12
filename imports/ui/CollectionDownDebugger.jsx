import React, { useEffect, useState } from 'react';
import { CollectionDown } from '../api/collectionDown';
import { useTracker, useSubscribe } from "meteor/react-meteor-data";

export const CollectionDownDebugger = () => {
  const [searchText, setSearchText] = useState('');

  // 1. Reactively track Minimongo data changes
  const { records, count, isLoading } = useTracker(() => {
    const data = CollectionDown.find({}, { sort: { createdAt: -1 } }).fetch();
    return {
      records: data,
      count: data.length,
      isLoading: !Meteor.status().connected && data.length === 0
    };
  });

  // 2. Filter engine logic
  const filteredRecords = records.filter(record => {
    if (!searchText) return true;
    return record.roomName?.toLowerCase().includes(searchText.toLowerCase());
  });


  useEffect(()=>{
    const iframe = document.getElementById("dse-front")
    if (iframe && iframe.contentWindow) {
      let payload=JSON.stringify({
          type: 'refresh-down',
          httpType: 'GET',
          data: records
        })
      console.log("🟥Meteor front: [sending  refresh-down with collectionDown data to pwa]",records);
      iframe.contentWindow.postMessage(
        payload,
        '*'
      );
    }
  },[records])

  return (
    <div className="debugger-container">
      
      {/* --- CARD HEADER --- */}
      <header className="debugger-header">
        <div className="header-title-container">
          <span>
            <span className="doc-count">{count}</span> docs [DownCollections]
          </span>
        </div>
      </header>

      {/* --- MAIN CARD BODY --- */}
      <div className="debugger-body">
        
        {/* --- SEARCH FILTER INPUT --- */}
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Filter by Room Name..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="search-input"
          />
          {searchText && (
            <button 
              onClick={() => setSearchText('')}
              className="clear-search-btn"
              title="Clear text"
            >
              &times;
            </button>
          )}
        </div>

        {/* --- TABLE IMPLEMENTATION --- */}
        <div className="table-responsive-wrapper">
          <table className="debugger-table">
            <thead className="table-header">
              <tr>
                <th className="table-th th-room">Room Name</th>
                <th className="table-th th-payload">Payload / Content</th>
                <th className="table-th th-time">Created At</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {isLoading ? (
                /* Loading Overlay State */
                <tr>
                  <td colSpan="3" className="table-message-cell">
                    <div className="loading-spinner"></div>
                    Loading context data...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                /* Empty Fallback State */
                <tr>
                  <td colSpan="3" className="table-message-cell italic-text">
                    No records loaded in Minimongo yet. Check your IndexedDB sync engine.
                  </td>
                </tr>
              ) : (
                /* Dynamic Lists Data Rendering */
                filteredRecords.map((record) => (
                  <tr key={record._id} className="table-row">
                    
                    {/* Room Name column with custom processing badge */}
                    <td className="table-td td-room">
                      <span className="room-badge-container">
                        <span className="pulse-indicator" />
                        {record.roomName || 'N/A'}
                      </span>
                    </td>
                    
                    {/* Payload content json renderer block */}
                    <td className="table-td">
                      <pre className="payload-json-block">
                        {JSON.stringify(record.payload, null, 2)}
                      </pre>
                    </td>
                    
                    {/* Time field timestamp block */}
                    <td className="table-td td-time">
                      {record.createdAt ? new Date(record.createdAt).toLocaleTimeString() : 'N/A'}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Embedded CSS styles scoped to this file */}
      <style>{`
        /* Container Layout */
        .debugger-container {
          margin: 1rem;
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }

        /* Header */
        .debugger-header {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .debugger-header {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .header-title-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #374151;
          font-weight: 600;
          font-size: 1.125rem;
        }

        .doc-count {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          color: #2563eb;
        }

        /* Body */
        .debugger-body {
          padding: 1rem;
        }

        /* Search Bar Input */
        .search-wrapper {
          position: relative;
          margin-bottom: 1rem;
          width: 100%;
          max-width: 28rem;
        }

        .search-input {
          width: 100%;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          padding-left: 0.75rem;
          padding-right: 2.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          color: #111827;
          outline: none;
          box-sizing: border-box;
        }

        .search-input::placeholder {
          color: #9ca3af;
        }

        .search-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 1px #3b82f6;
        }

        .clear-search-btn {
          position: absolute;
          right: 0.625rem;
          top: 0.625rem;
          color: #9ca3af;
          font-size: 0.875rem;
          font-weight: 700;
          background: transparent;
          border: none;
          cursor: pointer;
          outline: none;
        }

        .clear-search-btn:hover {
          color: #4b5563;
          background: transparent;
        }

        /* Responsive Table Wrapper */
        .table-responsive-wrapper {
          width: 100%;
          overflow-x: auto;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          position: relative;
        }

        /* Table Design */
        .debugger-table {
          width: 100%;
          text-align: left;
          font-size: 0.875rem;
          border-collapse: collapse;
        }

        .table-header {
          background-color: #f9fafb;
          color: #374151;
          font-weight: 500;
          text-transform: uppercase;
          font-size: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .table-th {
          padding: 0.75rem 1rem;
          border-right: 1px solid #e5e7eb;
        }

        .th-time {
          width: 140px;
          border-right: none;
        }

        .table-body {
          background-color: #ffffff;
          color: #111827;
        }

        .table-body tr {
          border-bottom: 1px solid #e5e7eb;
        }

        .table-body tr:last-child {
          border-bottom: none;
        }

        .table-row {
          transition: background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .table-row:hover {
          background-color: #f9fafb;
        }

        .table-td {
          padding: 0.75rem 1rem;
          border-right: 1px solid #e5e7eb;
        }

        .td-room {
          white-space: nowrap;
          font-weight: 500;
        }

        .td-time {
          white-space: nowrap;
          color: #6b7280;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.75rem;
          border-right: none;
        }

        /* Status Badges */
        .room-badge-container {
          display: inline-flex;
          align-items: center;
        }

        .pulse-indicator {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 9999px;
          background-color: #3b82f6;
          margin-right: 0.5rem;
          animation: pulse-animation 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse-animation {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }

        /* Code Blocks */
        .payload-json-block {
          margin: 0;
          background-color: #f9fafb;
          padding: 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          max-height: 10rem;
          overflow-y: auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          color: #374151;
          border: 1px solid #f3f4f6;
        }

        /* Alert States / Async Overlays */
        .table-message-cell {
          padding: 3rem 1rem;
          text-align: center;
          color: #6b7280;
        }

        .italic-text {
          font-style: italic;
        }

        .loading-spinner {
          display: inline-block;
          width: 1.25rem;
          height: 1.25rem;
          border-radius: 9999px;
          border: 2px solid #d1d5db;
          border-top-color: #2563eb;
          margin-right: 0.5rem;
          vertical-align: middle;
          animation: spin-animation 1s linear infinite;
        }

        @keyframes spin-animation {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};