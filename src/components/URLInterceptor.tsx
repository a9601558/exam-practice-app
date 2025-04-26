import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const URLInterceptor = () => {
  const location = useLocation();

  useEffect(() => {
    // Get URL parameters
    const params = new URLSearchParams(location.search);
    
    // Check if there are parameters to clean
    if (params.has('correctAnswer') || 
        (location.pathname === '/admin' && params.toString())) {
      console.log('拦截到问题URL参数，正在清理:', location.search);
      
      // Clean URL by keeping only the pathname
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Also prevent form submissions that might expose parameters
      const originalSubmit = HTMLFormElement.prototype.submit;
      HTMLFormElement.prototype.submit = function() {
        console.log('拦截到表单提交尝试，已阻止');
        return false;
      };
      
      // Restore original submit method after a timeout
      setTimeout(() => {
        HTMLFormElement.prototype.submit = originalSubmit;
      }, 1000);
    }
  }, [location]);

  // This component does not render anything
  return null;
};

export default URLInterceptor; 