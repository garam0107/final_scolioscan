import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { useLanguage } from '../contexts/LanguageContext';
import introImage1 from '../assets/icons/Onboarding/intro1.png';
import introImage2 from '../assets/icons/Onboarding/intro2.png';
import introImage3 from '../assets/icons/Onboarding/intro3.png';
import './OnboardingPage.css';

const OnboardingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const slides = [
    {
      title: t('onboarding.slide1Title'),
      content: t('onboarding.slide1Content'),
      image: introImage1
    },
    {
      title: t('onboarding.slide2Title'),
      content: t('onboarding.slide2Content'),
      image: introImage2
    },
    {
      title: t('onboarding.slide3Title'),
      content: t('onboarding.slide3Content'),
      image: introImage3
    }
  ];
 
  const handlers = useSwipeable({
    onSwipedLeft: () => handleNext(),
    onSwipedRight: () => handlePrev(),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });
 
  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/login');
    }
  };
 
  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };
 
  const currentSlideData = slides[currentSlide];
  const isFirstSlide = currentSlide === 0;
  const isSecondSlide = currentSlide === 1;
  const isThirdSlide = currentSlide === 2;
 
  return (
    <div className="onboarding-page" {...handlers}>
      <div className="onboarding-container">
        <div className="onboarding-logo">
          <div className="logo-text">Scolioscan</div>
        </div>
 
        <div className="onboarding-card">
          <div className="slide-image">
            {isFirstSlide && currentSlideData.image ? (
              <img 
                src={currentSlideData.image} 
                alt={t('onboarding.slide1Title')}
                className="intro-image"
                onError={(e) => {
                  console.error('Image failed to load:', currentSlideData.image);
                  e.target.style.display = 'none';
                }}
              />
            ) : (isSecondSlide || isThirdSlide) && currentSlideData.image ? (
              <img 
                src={currentSlideData.image} 
                alt={isSecondSlide ? t('onboarding.slide2Title') : t('onboarding.slide3Title')} 
                className="intro-image"
                onError={(e) => {
                  console.error('Image failed to load:', currentSlideData.image);
                  e.target.style.display = 'none';
                }}
              />
            ) : currentSlideData.image ? (
              <span className="emoji-icon">{currentSlideData.image}</span>
            ) : null}
          </div>
           
          <div className="slide-text-content">
            <h1 className="slide-title">{currentSlideData.title}</h1>
            {(isFirstSlide || isSecondSlide || isThirdSlide) && Array.isArray(currentSlideData.content) ? (
              <div className="slide-content-list">
                {currentSlideData.content.map((line, index) => (
                  <p key={index} className="slide-content-line">{line}</p>
                ))}
              </div>
            ) : (
              <p className="slide-content">{currentSlideData.content}</p>
            )}
          </div>
        </div>
 
        <div className="slide-indicators">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>

        <div className="slide-navigation">
          {!isFirstSlide && (
            <button className="nav-button nav-prev" onClick={handlePrev}>
              {t('common.prev')}
            </button>
          )}
          <div className="nav-spacer" />
          <button className="nav-button nav-next" onClick={handleNext}>
            {t('common.next')}
          </button>
        </div>
      </div>
    </div>
  );
};
 
export default OnboardingPage;
