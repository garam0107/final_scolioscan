import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiMenu } from 'react-icons/fi';
import { alarmAPI } from '../utils/api';
import './TopMenu.css';

const TopMenu = ({ onMenuClick, onAlarmClick }) => {
  const [alarmCount, setAlarmCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadAlarmCount();
  }, []);

  const loadAlarmCount = async () => {
    try {
      const response = await alarmAPI.getUnreadCount();
      setAlarmCount(response.data.count);
    } catch (error) {
      console.error('Failed to load alarm count:', error);
    }
  };

  return (
    <div className="top-menu">
      <div className="top-menu-left" onClick={() => navigate('/home')}>
        <span className="logo">Scolioscan</span>
      </div>
      <div className="top-menu-right">
        <div className="alarm-icon-container" onClick={onAlarmClick}>
          <FiBell className="icon" />
          {alarmCount > 0 && <span className="alarm-badge"></span>}
        </div>
        <FiMenu className="icon" onClick={onMenuClick} />
      </div>
    </div>
  );
};

export default TopMenu;
