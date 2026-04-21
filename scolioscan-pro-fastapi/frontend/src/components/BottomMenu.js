import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
// 비활성화 아이콘
import HomeIcon from '../assets/icons/Home.svg';
import SearchIcon from '../assets/icons/Search.svg';
import Search2Icon from '../assets/icons/Search2.svg';
import BurgerIcon from '../assets/icons/Burger.svg';
// 활성화 아이콘
import ActiveHomeIcon from '../assets/icons/ActiveHome.svg';
import ActiveSearchIcon from '../assets/icons/ActiveSearch.svg';
import ActiveSearch2Icon from '../assets/icons/ActiveSearch2.svg';
import ActiveBurgerIcon from '../assets/icons/ActiveBurger.svg';

const BottomMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const menuItems = [
    { path: '/home', labelKey: 'nav.home', icon: HomeIcon, activeIcon: ActiveHomeIcon },
    { path: '/analysis', labelKey: 'nav.analysis', icon: SearchIcon, activeIcon: ActiveSearchIcon },
    { path: '/report', labelKey: 'nav.report', icon: Search2Icon, activeIcon: ActiveSearch2Icon },
    { path: '/more', labelKey: 'nav.more', icon: BurgerIcon, activeIcon: ActiveBurgerIcon },
  ];

  return (
    <div className="fixed bg-white bottom-0 left-0 right-0 flex items-center justify-between px-10 py-2 rounded-tl-[20px] rounded-tr-[20px] shadow-[0px_0px_16px_0px_rgba(0,0,0,0.1)] w-full z-50">
      {menuItems.map((item) => {
        const isActive = location.pathname === item.path;

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex flex-col gap-[2px] items-center justify-center"
          >
            <div className="flex items-center justify-center h-[30px] w-[30px]">
              <img
                alt={item.label}
                className="w-full h-full object-contain"
                style={{
                  filter: isActive
                    ? 'brightness(0) saturate(100%) invert(66%) sepia(23%) saturate(1389%) hue-rotate(124deg) brightness(94%) contrast(91%)'
                    : 'brightness(0) saturate(100%) invert(71%) sepia(10%) saturate(336%) hue-rotate(183deg) brightness(89%) contrast(87%)'
                }}
                src={isActive ? item.activeIcon : item.icon}
              />
            </div>
            <div className={`text-[11px] text-center leading-[16px] ${
              isActive ? 'text-[#22BCB7]' : 'text-gray-400'
            }`}>
              {t(item.labelKey)}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default BottomMenu;
