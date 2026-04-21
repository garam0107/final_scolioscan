import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { alarmAPI } from '../utils/api';
import './AlarmPanel.css';

const AlarmPanel = ({ isOpen, onClose }) => {
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAlarms();
    }
  }, [isOpen]);

  const loadAlarms = async () => {
    setLoading(true);
    try {
      const response = await alarmAPI.getAlarms();
      setAlarms(response.data);
    } catch (error) {
      console.error('Failed to load alarms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAlarmClick = async (alarm) => {
    if (!alarm.read_at) {
      try {
        await alarmAPI.markAsRead(alarm.id);
        setAlarms(alarms.map(a =>
          a.id === alarm.id ? { ...a, read_at: new Date().toISOString() } : a
        ));
      } catch (error) {
        console.error('Failed to mark alarm as read:', error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await alarmAPI.markAllAsRead();
      setAlarms(alarms.map(a => ({ ...a, read_at: new Date().toISOString() })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={`alarm-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`alarm-panel ${isOpen ? 'open' : ''}`}>
        <div className="alarm-header">
          <FiX className="back-icon" onClick={onClose} />
          <h1>알림</h1>
          <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
            모두 읽음
          </button>
        </div>

        <div className="alarm-content">
          {loading ? (
            <div className="alarm-loading">
              <p>알림을 불러오는 중...</p>
            </div>
          ) : alarms.length === 0 ? (
            <div className="alarm-empty">
              <span className="empty-icon">🔔</span>
              <p>알림이 없습니다</p>
            </div>
          ) : (
            <div className="alarm-list">
              {alarms.map((alarm) => (
                <div
                  key={alarm.id}
                  className={`alarm-item card ${alarm.read_at ? 'read' : 'unread'}`}
                  onClick={() => handleAlarmClick(alarm)}
                >
                  <div className="alarm-item-header">
                    <h3>{alarm.title}</h3>
                    {!alarm.read_at && <span className="unread-badge"></span>}
                  </div>
                  <p className="alarm-content-text">{alarm.content}</p>
                  <span className="alarm-time">
                    {new Date(alarm.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AlarmPanel;
