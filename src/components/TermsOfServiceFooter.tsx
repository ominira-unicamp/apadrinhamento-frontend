import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const TERMS_ACCEPTED_KEY = "termsOfServiceAccepted";

export function TermsOfServiceFooter() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const termsAccepted = localStorage.getItem(TERMS_ACCEPTED_KEY);
    if (!termsAccepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(TERMS_ACCEPTED_KEY, "true");
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 shadow-lg z-50">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm sm:text-base text-center sm:text-left">
          Ao usar este site, você concorda com nossos{" "}
          <Link 
            to="/termos" 
            className="text-blue-400 hover:text-blue-300 underline font-medium"
          >
            Termos de Serviço
          </Link>
          .
        </p>
        <button
          onClick={handleAccept}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors duration-200 whitespace-nowrap cursor-pointer"
        >
          OK, Entendi
        </button>
      </div>
    </div>
  );
}
