import React, { useState } from 'react';
import BottomMenu from '../components/BottomMenu';

import MapImage from '../assets/icons/Hospital/MapImage.png';
import IconAddress from '../assets/icons/Hospital/IconAddress.svg';
import IconPhone from '../assets/icons/Hospital/IconPhone.svg';
import IconSearch from '../assets/icons/Hospital/IconSearch.svg';
import IconArrowLeft from '../assets/icons/Hospital/IconArrowLeft.svg';
import Hospital1 from '../assets/icons/Hospital/Hospital1.png';
import Hospital2 from '../assets/icons/Hospital/Hospital2.png';
import Hospital3 from '../assets/icons/Hospital/Hospital3.png';
import Hospital4 from '../assets/icons/Hospital/Hospital4.png';

const DUMMY_HOSPITALS = [
  {
    id: '1',
    name: '강남바른 정형외과',
    category: '정형외과',
    phone: '02-1234-5678',
    address: '서울 강남구 선릉로 82길 214',
    roadAddress: '강남구 선릉로 82길 214',
    distance: '350',
    imageUrl: Hospital1,
  },
  {
    id: '2',
    name: '더케어통증의학과',
    category: '통증의학과',
    phone: '02-2345-6789',
    address: '서울 강남구 압구정로 123',
    roadAddress: '강남구 압구정로 123',
    distance: '850',
    imageUrl: Hospital2,
  },
  {
    id: '3',
    name: '굿본 재활의학과의원',
    category: '재활의학과',
    phone: '02-3456-7890',
    address: '서울 강남구 신사동 456',
    roadAddress: '강남구 신사동 456',
    distance: '1200',
    imageUrl: Hospital3,
  },
  {
    id: '4',
    name: '마디랑정형외과의원',
    category: '정형외과',
    phone: '02-4567-8901',
    address: '서울 강남구 청담동 789',
    roadAddress: '강남구 청담동 789',
    distance: '1500',
    imageUrl: Hospital4,
  },
];

const HospitalPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hospitals] = useState(DUMMY_HOSPITALS);
  const [selectedHospital, setSelectedHospital] = useState(DUMMY_HOSPITALS[0]);
  const [showList, setShowList] = useState(false);
  const [isLoading] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const handleSearchInput = (e) => {
    setSearchQuery(e.target.value);
  };

  const toggleList = () => {
    setShowList((prev) => !prev);
  };

  if (showList) {
    return (
      <div className="bg-white min-h-screen flex flex-col pb-[80px]">
        <div className="box-border flex gap-[20px] h-[68px] items-center p-[20px] shrink-0 w-full sticky top-0 bg-white z-20">
          <button onClick={toggleList} className="flex gap-[10px] items-center">
            <div className="relative shrink-0 size-[24px]">
              <div className="absolute flex inset-[17.71%_32.29%] items-center justify-center">
                <div className="flex-none h-[8.5px] rotate-[90deg] w-[15.5px]">
                  <img alt="" className="block max-w-none size-full" src={IconArrowLeft} />
                </div>
              </div>
            </div>
          </button>
          <div className="font-['Pretendard_Variable',sans-serif] font-semibold text-[#2b2f36] text-[18px] leading-[24px]">
            지도로 돌아가기
          </div>
        </div>

        <div className="bg-neutral-100 h-px shrink-0 w-full sticky top-[68px] z-20" />

        <div className="bg-white flex flex-col items-start pb-0 pt-0 px-0 shrink-0 w-full">
          {hospitals.map((hospital) => (
            <button
              key={hospital.id}
              type="button"
              onClick={() => {
                setSelectedHospital(hospital);
                setShowList(false);
              }}
              className="box-border flex gap-[16px] items-start p-[16px] shrink-0 w-full text-left"
            >
              <div className="opacity-90 relative rounded-[12px] shrink-0 size-[148px] overflow-hidden">
                {hospital.imageUrl ? (
                  <img
                    alt={hospital.name}
                    className="absolute inset-0 max-w-none object-cover rounded-[12px] size-full"
                    src={hospital.imageUrl}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-100 rounded-[12px]" />
                )}
              </div>

              <div className="basis-0 flex flex-col gap-[12px] grow items-start min-h-px min-w-px">
                <div className="flex flex-col gap-[2px] items-start w-full">
                  <p className="font-['Pretendard_Variable',sans-serif] font-semibold text-[#25272d] text-[18px] leading-[24px]">
                    {hospital.name}
                  </p>
                  <p className="font-['Pretendard_Variable',sans-serif] font-medium text-[#2e96ff] text-[14px] leading-[20px]">
                    {hospital.id === '2'
                      ? '스포츠 손상 전문 통증의학과 전문의 2인'
                      : hospital.id === '3'
                      ? '정형외과 x 통증의학과 통증치료 선릉역 4번역 위치'
                      : '평일 매일 20시 야간진료'}
                  </p>
                </div>

                <div className="flex flex-col gap-[4px] w-full text-[14px] text-[#515968] leading-[20px]">
                  <div className="flex gap-[4px] items-center">
                    <img alt="" className="size-[16px]" src={IconPhone} />
                    {hospital.phone}
                  </div>
                  <div className="flex gap-[4px] items-center">
                    <img alt="" className="size-[16px]" src={IconAddress} />
                    {hospital.roadAddress || hospital.address}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <BottomMenu />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex flex-col relative">
      <div className="bg-white p-[12px] shrink-0 z-20 relative">
        <form onSubmit={handleSearch}>
          <div className="bg-white flex gap-[8px] items-center px-[16px] py-[12px] rounded-[21px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.2)]">
            <button type="submit" className="relative shrink-0 size-[16px]">
              <img alt="검색" className="w-full h-full object-contain" src={IconSearch} />
            </button>
            <input
              type="text"
              placeholder="병원을 검색하세요"
              value={searchQuery}
              onChange={handleSearchInput}
              className="flex-1 font-['Pretendard_Variable',sans-serif] font-medium text-[#25272d] text-[13px] leading-[18px] outline-none bg-transparent placeholder:text-[#7e89a0]"
            />
          </div>
        </form>
      </div>

      <div className="flex-1 relative overflow-hidden transition-all duration-300">
        <img src={MapImage} alt="지도" className="absolute inset-0 w-full h-full object-cover" />

        <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-[12px] p-4 shadow-lg z-10">
          <p className="font-['Pretendard_Variable',sans-serif] font-semibold text-[#25272d] text-[14px] leading-[20px] mb-1">
            💡 지도 기능 테스트 모드
          </p>
          <p className="font-['Pretendard_Variable',sans-serif] font-medium text-[#515968] text-[12px] leading-[18px]">
            실제 지도를 사용하려면 Kakao API 키를 설정하세요.
          </p>
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50">
            <div className="text-[#25272d] font-['Pretendard_Variable',sans-serif] font-medium text-[14px]">
              검색 중...
            </div>
          </div>
        )}
      </div>

        {selectedHospital && !showList && (
        <div className="fixed bottom-0 left-0 right-0 bg-white rounded-tl-[20px] rounded-tr-[20px] shadow-[0px_0px_16px_0px_rgba(0,0,0,0.1)] z-10 pb-[80px]">
          <div className="relative px-[16px] pt-[32px] pb-[16px]">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[130%]">
              <button
                onClick={toggleList}
                className="bg-white flex gap-[6px] items-center justify-center px-[20px] py-[10px] rounded-[22px] shadow-[0px_0px_10px_0px_rgba(0,0,0,0.2)]"
              >
                <svg className="w-[11px] h-[11px]" viewBox="0 0 11 11" fill="none">
                  <path
                    d="M3.5 2.5H9.5M3.5 5.5H9.5M3.5 8.5H9.5M1.5 2.5H1.51M1.5 5.5H1.51M1.5 8.5H1.51"
                    stroke="#2b2f36"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-['Pretendard_Variable',sans-serif] font-medium text-[#2b2f36] text-[13px] leading-[18px]">
                  목록
                </span>
              </button>
            </div>

            <div className="flex gap-[16px]">
              <div className="shrink-0 w-[148px] h-[148px] rounded-[12px] overflow-hidden">
                {selectedHospital.imageUrl ? (
                  <img
                    src={selectedHospital.imageUrl}
                    alt={selectedHospital.name}
                    className="w-full h-full object-cover opacity-90"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center" />
                )}
              </div>

              <div className="flex-1 flex flex-col gap-[8px] min-w-0">
                <div className="flex flex-col gap-[2px]">
                  <h3 className="font-['Pretendard_Variable',sans-serif] font-semibold text-[#25272d] text-[16px] leading-[22px] truncate">
                    {selectedHospital.name}
                  </h3>
                  <p className="font-['Pretendard_Variable',sans-serif] font-medium text-[#2e96ff] text-[13px] leading-[18px]">
                    {/* {selectedHospital.category} */}
                    평일 매일 20시 야간진료
                  </p>
                </div>

                <div className="flex flex-col gap-[4px]">
                  <div className="flex gap-[4px] items-center">
                    <div className="relative shrink-0 size-[16px]">
                      <img alt="" className="w-full h-full object-contain" src={IconPhone} />
                    </div>
                    <a
                      href={`tel:${selectedHospital.phone}`}
                      className="font-['Pretendard_Variable',sans-serif] font-medium text-[#515968] text-[13px] leading-[18px] hover:text-[#2e96ff] truncate"
                    >
                      {selectedHospital.phone}
                    </a>
                  </div>

                  <div className="flex gap-[4px] items-start">
                    <div className="relative shrink-0 size-[16px] mt-[2px]">
                      <img alt="" className="w-full h-full object-contain" src={IconAddress} />
                    </div>
                    <span className="font-['Pretendard_Variable',sans-serif] font-medium text-[#515968] text-[13px] leading-[18px] flex-1">
                      {selectedHospital.roadAddress || selectedHospital.address}
                    </span>
                  </div>

                  {/* {selectedHospital.distance && (
                    <div className="flex gap-[4px] items-center mt-[4px]">
                      <span className="font-['Pretendard_Variable',sans-serif] font-medium text-[#97a2b9] text-[12px] leading-[16px]">
                        현재 위치에서 약 {Math.round(parseInt(selectedHospital.distance, 10))}m
                      </span>
                    </div>
                  )} */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomMenu />
    </div>
  );
};

export default HospitalPage;

