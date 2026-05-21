import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Chỉ scroll phần nội dung chính, không scroll sidebar
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;