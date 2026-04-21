import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiUser, FiCreditCard, FiSettings, FiHelpCircle, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AppIcon1 from '../assets/icons/My/AppIcon1.png';
import AppIcon2 from '../assets/icons/My/AppIcon2.png';
import AppIcon3 from '../assets/icons/My/AppIcon3.png';
import AppIcon4 from '../assets/icons/My/AppIcon4.png';
import './SideMenu.css';

const SideMenu = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const handleMenuClick = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="side-menu-overlay" onClick={onClose}></div>
      <div className={`side-menu ${isOpen ? 'open' : ''}`}>
        <div className="side-menu-header">
          <FiX className="close-icon" onClick={onClose} />
        </div>

        <div className="side-menu-profile">
          <div className="profile-info">
            <h3>{user?.name || 'User'}</h3>
            <p>{user?.user_id || 'email@example.com'}</p>
            <span className="member-grade">{t('sideMenu.regularMember')}</span>
          </div>
        </div>

        <div className="side-menu-items">
          <div className="menu-item" onClick={() => handleMenuClick('/profile/edit')}>
            <FiUser className="menu-icon" />
            <span>{t('sideMenu.accountInfo')}</span>
          </div>
          <div className="menu-item" onClick={() => handleMenuClick('/subscription')}>
            <FiCreditCard className="menu-icon" />
            <span>{t('sideMenu.subscriptionSettings')}</span>
          </div>
          <div className="menu-item" onClick={() => handleMenuClick('/settings')}>
            <FiSettings className="menu-icon" />
            <span>{t('sideMenu.settings')}</span>
          </div>
          <div className="menu-item" onClick={() => handleMenuClick('/contact')}>
            <FiHelpCircle className="menu-icon" />
            <span>{t('sideMenu.customerService')}</span>
          </div>
          <div className="menu-item" onClick={handleLogout}>
            <FiLogOut className="menu-icon" />
            <span>{t('sideMenu.logout')}</span>
          </div>
        </div>

{/* 관련 서비스 - 이후에 사용될 수 있음
        <div className="side-menu-footer">
          <p className="footer-title">{t('sideMenu.relatedServices')}</p>
          <div className="service-apps">
            <div className="app-item">
              <div className="app-icon">
                <img src={AppIcon1} alt={t('sideMenu.gymWork')} />
              </div>
              <span>{t('sideMenu.gymWork')}</span>
            </div>
            <div className="app-item">
              <div className="app-icon">
                <img src={AppIcon2} alt={t('sideMenu.spineHealth')} />
              </div>
              <span>{t('sideMenu.spineHealth')}</span>
            </div>
            <div className="app-item">
              <div className="app-icon">
                <img src={AppIcon3} alt={t('sideMenu.smartShoes')} />
              </div>
              <span>{t('sideMenu.smartShoes')}</span>
            </div>
            <div className="app-item">
              <div className="app-icon">
                <img src={AppIcon4} alt={t('sideMenu.wristDoctor')} />
              </div>
              <span>{t('sideMenu.wristDoctor')}</span>
            </div>
          </div>
        </div>
        */}
      </div>
    </>
  );
};

export default SideMenu;
