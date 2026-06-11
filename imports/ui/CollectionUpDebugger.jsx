import React, { useState, useEffect } from 'react';
import { CollectionUp } from '../api/collectionUp';
import { useTracker, useSubscribe } from "meteor/react-meteor-data";
import { Meteor } from 'meteor/meteor';

export const CollectionUpDebugger = () => {
  const [searchText, setSearchText] = useState('');
  const [hasSettled, setHasSettled] = useState(false);

  // 1. Reactively track Minimongo data changes & subscription state
  const { records, count, isLoading } = useTracker(() => {
    const handle = Meteor.subscribe('collectionUp');
    const data = CollectionUp.find({}).fetch();
    return {
      records: data,
      count: data.length,
      isLoading: !handle.ready()
    };
  }, []);

  // 2. Mirror your settlement logic for local state evaluation thresholds
  useEffect(() => {
    if (records.length > 0) {
      setHasSettled(true);
    } else {
      const timer = setTimeout(() => setHasSettled(true), 300);
      return () => clearTimeout(timer);
    }
  }, [records.length]);

  // 3. Filter engine logic (matches content text or structural count string)
  const filteredRecords = records.filter(record => {
    if (!searchText) return true;
    const matchText = record.text?.toLowerCase().includes(searchText.toLowerCase());
    const matchID = record._id?.toLowerCase().includes(searchText.toLowerCase());
    return matchText || matchID;
  });

  return (
    <div className="debugger-container up-variant">
      
      {/* --- CARD HEADER --- */}
      <header className="debugger-header">
        <div className="header-title-container">
          <span>
            <span className="doc-count">{count}</span> docs [UpCollections]
          </span>
          <span className={`status-text-badge ${hasSettled ? 'settled' : 'loading'}`}>
            {hasSettled ? "Settled" : "Loading"}
          </span>
        </div>
      </header>

      {/* --- MAIN CARD BODY --- */}
      <div className="debugger-body">
        
        {/* --- SEARCH FILTER INPUT --- */}
        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Filter by Content Text / _id.."
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
                <th className="table-th th-cnt">_id</th>
                <th className="table-th th-text">Content </th>
    
              </tr>
            </thead>
            <tbody className="table-body">
              {isLoading || !hasSettled ? (
                /* Loading Overlay State */
                <tr>
                  <td colSpan="3" className="table-message-cell">
                    <div className="loading-spinner"></div>
                    Settling data pipeline records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                /* Empty Fallback State */
                <tr>
                  <td colSpan="3" className="table-message-cell italic-text">
                    No records loaded in Minimongo [UP] yet.
                  </td>
                </tr>
              ) : (
                /* Dynamic Lists Data Rendering */
                filteredRecords.map((record) => (
                  <tr key={record._id} className="table-row">
                    
                    {/* Count Variable field indicator */}
                    <td className="table-td td-cnt">
                      <span className="room-badge-container">
                        <span className="pulse-indicator" />
                        {record._id}
                      </span>
                    </td>
                    
                    {/* Main Document Content payload string mapping */}
                    <td className="table-td td-text">
                      <div className="content-text-wrapper">
                        {JSON.stringify(record)||'N/A'}
                      </div>
                    </td>
                    


                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Embedded CSS styles scoped to match the Down component theme */}
      <style>{`
        /* Container Layout */
        .debugger-container.up-variant {
          margin: 1rem 0;
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }

        /* Header Layout Matrix */
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
          gap: 0.75rem;
          color: #374151;
          font-weight: 600;
          font-size: 1.125rem;
        }

        .up-variant .doc-count {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          color: #059669; /* Emerald Green theme colors */
        }

        /* Settlement Badge Markers */
        .status-text-badge {
          font-size: 0.75rem;
          padding: 0.125rem 0.5rem;
          border-radius: 0.25rem;
          font-weight: 500;
        }
        .status-text-badge.settled {
          background-color: #d1fae5;
          color: #065f46;
        }
        .status-text-badge.loading {
          background-color: #fef3c7;
          color: #92400e;
        }

        /* Body Configuration */
        .debugger-body {
          padding: 1rem;
        }

        /* Search Bar Input Structure */
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
          border-color: #10b981;
          box-shadow: 0 0 0 1px #10b981;
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
        }

        /* Responsive Table Shell Wrapper Layout */
        .table-responsive-wrapper {
          width: 100%;
          overflow-x: auto;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          position: relative;
        }

        /* Native HTML Semantic Table CSS Grid Elements */
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

        .th-cnt { width: 140px; }
        .th-status { width: 120px; border-right: none; }

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

        .td-cnt {
          white-space: nowrap;
          font-weight: 600;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        .td-text {
          color: #374151;
        }

        .td-status {
          white-space: nowrap;
          color: #6b7280;
          font-size: 0.75rem;
          border-right: none;
        }

        .content-text-wrapper {
          max-height: 8rem;
          overflow-y: auto;
          word-break: break-all;
        }

        /* Reactive Status Micro-badges */
        .room-badge-container {
          display: inline-flex;
          align-items: center;
        }

        .up-variant .pulse-indicator {
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 9999px;
          background-color: #10b981; /* Green tracking marker */
          margin-right: 0.5rem;
          animation: pulse-animation 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse-animation {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }

        /* Message/Error Framework Overlays */
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
          border-top-color: #10b981;
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