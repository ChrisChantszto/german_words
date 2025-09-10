import React from 'react';

type Language = {
  code: string;
  name: string;
  flag: string;
};

type LanguagePickerProps = {
  currentLanguage: string;
  onLanguageChange: (languageCode: string) => void;
};

const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'de', name: 'German', flag: '🇩🇪' },
  // Add more languages in the future
  // { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  // { code: 'fr', name: 'French', flag: '🇫🇷' },
];

export const LanguagePicker: React.FC<LanguagePickerProps> = ({ 
  currentLanguage, 
  onLanguageChange 
}) => {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="language-select" className="sr-only">
        Select Language
      </label>
      <select
        id="language-select"
        value={currentLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};
