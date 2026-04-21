import React, { useMemo, useState } from 'react';

// Shopping 전용 이미지 - 제품 사진
import Product1 from '../assets/icons/Shopping/Product1.png';
import Product2 from '../assets/icons/Shopping/Product2.png';
import Product3 from '../assets/icons/Shopping/Product3.png';
import Product4 from '../assets/icons/Shopping/Product4.png';
import Product5 from '../assets/icons/Shopping/Product5.png';
import Product6 from '../assets/icons/Shopping/Product6.png';
import Product7 from '../assets/icons/Shopping/Product7.png';
import Product8 from '../assets/icons/Shopping/Product8.png';

// Shopping 전용 아이콘
import HeartIcon from '../assets/icons/Shopping/HeartIcon.svg';
import SearchIcon from '../assets/icons/Shopping/SearchIcon.svg';

import BottomMenu from '../components/BottomMenu';

// 로컬 아이콘 에셋 매핑
const imgImage815 = Product1;
const img2 = Product2;
const img3 = Product3;
const img4 = Product4;
const img5 = Product5;
const img6 = Product6;
const img7 = Product7;
const img8 = Product8;
const heartImg = HeartIcon;
const searchImg = SearchIcon;

const CATEGORIES = ['모든상품', '보조기구', '마사지', '의자'];

const PRODUCTS = [
  {
    id: 1,
    image: imgImage815,
    title: '바른 자세 벨트 캐리백',
    description: '골반 정렬과 자세 교정을 돕는 바른 자세 벨트',
    discount: '12%',
    price: '38,000원',
    category: '보조기구',
  },
  {
    id: 2,
    image: img2,
    title: '더블 폼롤러 Outer',
    description: '넓은 부위를 깊고 시원하게 푸는 겉근육 전용 폼롤러',
    discount: '15%',
    price: '40,000원',
    category: '마사지',
  },
  {
    id: 3,
    image: img3,
    title: '바른 자세 벨트 캐리백',
    description: '골반 정렬과 자세 교정을 돕는 바른 자세 벨트',
    price: '38,000원',
    category: '보조기구',
  },
  {
    id: 4,
    image: img4,
    title: '바른 자세 벨트 캐리백',
    description: '골반 정렬과 자세 교정을 돕는 바른 자세 벨트',
    discount: '12%',
    price: '38,000원',
    category: '보조기구',
  },
  {
    id: 5,
    image: img5,
    title: '바른 자세 벨트 캐리백',
    description: '골반 정렬과 자세 교정을 돕는 바른 자세 벨트',
    price: '38,000원',
    category: '보조기구',
  },
  {
    id: 6,
    image: img6,
    title: '바른 자세 벨트 캐리백',
    description: '골반 정렬과 자세 교정을 돕는 바른 자세 벨트',
    discount: '12%',
    price: '38,000원',
    category: '보조기구',
  },
  {
    id: 7,
    image: img7,
    title: '바른 자세 벨트 캐리백',
    description: '골반 정렬과 자세 교정을 돕는 바른 자세 벨트',
    discount: '12%',
    price: '38,000원',
    category: '보조기구',
  },
  {
    id: 8,
    image: img8,
    title: '바른 자세 벨트 캐리백',
    description: '골반 정렬과 자세 교정을 돕는 바른 자세 벨트',
    discount: '12%',
    price: '38,000원',
    category: '보조기구',
  },
];

const ProductCard = ({ image, title, description, discount, price }) => (
  <div className="basis-0 content-stretch flex flex-col gap-[6px] grow items-start min-h-px min-w-px relative shrink-0">
    <div className="aspect-[160/160] bg-[#f3f4f7] content-stretch flex gap-[10px] items-center overflow-clip relative rounded-[8px] shrink-0 w-full">
      <div className="aspect-[164/164] basis-0 grow min-h-px min-w-px relative shrink-0">
        <img alt="" className="absolute inset-0 max-w-none object-center object-cover pointer-events-none size-full" src={image} />
      </div>
      <div className="absolute overflow-clip right-[8px] size-[24px] top-[8px]">
        <div className="absolute inset-[18.06%_12.5%_18.06%_12.49%]">
          <div className="absolute bottom-[0.54%] left-0 right-0 top-0">
            <img alt="" className="block max-w-none size-full" src={heartImg} />
          </div>
        </div>
      </div>
    </div>
    <div className="box-border content-stretch flex flex-col gap-[8px] items-start px-[4px] py-0 relative shrink-0 w-full">
      <div className="content-stretch flex flex-col gap-[2px] items-start not-italic relative shrink-0 w-full">
        <p className="-webkit-box font-['Pretendard_Variable:SemiBold',sans-serif] leading-[20px] overflow-ellipsis overflow-hidden relative shrink-0 text-[#2b2f36] text-[14px] w-full">
          {title}
        </p>
        <p className="font-['Pretendard_Variable:Regular',sans-serif] leading-[16px] relative shrink-0 text-[#7e89a0] text-[12px] w-full">
          {description}
        </p>
      </div>
      {discount ? (
        <div className="content-stretch flex font-bold gap-[4px] items-start leading-[0] relative shrink-0 text-[16px] text-nowrap tracking-[0.32px]">
          <div className="flex flex-col font-['Manrope:Bold',sans-serif] justify-center relative shrink-0 text-[#22bcb7]">
            <p className="leading-[22px] text-nowrap whitespace-pre">{discount}</p>
          </div>
          <div className="flex flex-col font-['Manrope:Bold','Noto_Sans_KR:Bold',sans-serif] justify-center relative shrink-0 text-black">
            <p className="leading-[22px] text-nowrap whitespace-pre">{price}</p>
          </div>
        </div>
      ) : (
        <div className="content-stretch flex gap-[4px] items-start relative shrink-0">
          <div className="flex flex-col font-['Manrope:Bold','Noto_Sans_KR:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[16px] text-black text-nowrap tracking-[0.32px]">
            <p className="leading-[22px] whitespace-pre">{price}</p>
          </div>
        </div>
      )}
    </div>
  </div>
);

const ShoppingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('모든상품');

  const filteredProducts = useMemo(() => {
    let filtered = PRODUCTS;

    if (selectedCategory !== '모든상품') {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const lowered = searchQuery.toLowerCase();
      filtered = filtered.filter((product) => product.title.toLowerCase().includes(lowered));
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const productRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < filteredProducts.length; i += 2) {
      rows.push(filteredProducts.slice(i, i + 2));
    }
    return rows;
  }, [filteredProducts]);

  return (
    <div className="bg-white content-stretch flex flex-col items-start relative min-h-screen">
      <div className="bg-gradient-to-b box-border content-stretch flex flex-col from-[#edeff2] from-[40.385%] items-start overflow-clip pb-0 pt-[4px] px-0 relative shrink-0 to-[#ffffff] w-full">
        <div className="box-border content-stretch flex items-center justify-between p-[12px] relative shrink-0 w-full">
          <div className="basis-0 bg-white box-border content-stretch flex gap-[8px] grow items-center min-h-px min-w-px px-[16px] py-[12px] relative rounded-[21px] shadow-[0px_0px_16px_0px_rgba(0,0,0,0.04)] shrink-0">
            <div className="relative shrink-0 size-[16px]">
              <div className="absolute inset-[8.45%_7.12%_5.21%_8.45%]">
                <img alt="" className="block max-w-none size-full" src={searchImg} />
              </div>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="상품을 검색하세요"
              className="flex-1 font-['Pretendard_Variable:Medium',sans-serif] text-[#7e89a0] text-[13px] leading-[18px] outline-none bg-transparent placeholder:text-[#7e89a0]"
            />
          </div>
        </div>

        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative shrink-0 w-full">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className="box-border content-stretch flex gap-[6px] h-[40px] items-center justify-center overflow-clip px-[8px] py-0 relative shrink-0 cursor-pointer"
            >
              <p
                className={`font-['Manrope:Medium','Noto_Sans_KR:Medium',sans-serif] font-medium leading-[20px] relative shrink-0 text-[14px] text-nowrap tracking-[0.28px] whitespace-pre ${
                  selectedCategory === category ? 'text-[#2c9696]' : 'text-[#7e89a0]'
                }`}
              >
                {category}
              </p>
            </button>
          ))}
        </div>
      </div>

      {productRows.length > 0 ? (
        <div className="box-border content-stretch flex flex-col gap-[20px] items-start overflow-clip pb-[80px] pt-[14px] px-[20px] relative w-full">
          {productRows.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full">
              {row.map((product) => (
                <ProductCard
                  key={product.id}
                  image={product.image}
                  title={product.title}
                  description={product.description}
                  discount={product.discount}
                  price={product.price}
                />
              ))}
              {row.length === 1 && <div className="basis-0 grow min-h-px min-w-px" />}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-[12px] items-center justify-center w-full pb-[80px]">
          <div className="relative size-[48px]">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="22" stroke="#D1D5DB" strokeWidth="2" fill="none" />
              <path d="M24 14V26" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />
              <circle cx="24" cy="32" r="1.5" fill="#D1D5DB" />
            </svg>
          </div>
          <div className="flex flex-col font-['Pretendard_Variable:Medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#657085] text-[14px] text-nowrap">
            <p className="leading-[20px] whitespace-pre">검색 결과가 없습니다</p>
          </div>
        </div>
      )}

      <BottomMenu />
    </div>
  );
};

export default ShoppingPage;

