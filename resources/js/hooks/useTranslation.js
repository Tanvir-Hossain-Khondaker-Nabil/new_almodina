import { usePage } from '@inertiajs/react';
import { useCallback } from 'react';

export const useTranslation = () => {
    const { props } = usePage();
    
    const t = useCallback((key, replacements = {}) => {
        // Key format: 'file.key' or just 'key' (will search in all files)
        let translation = null;
        
        if (key.includes('.')) {
            // Specific file lookup: 'auth.welcome'
            const [file, stringKey] = key.split('.', 2);
            translation = props.language?.[file]?.[stringKey];
        } else {
            // Search in all files for the key
            for (const file of Object.values(props.language || {})) {
                if (file[key]) {
                    translation = file[key];
                    break;
                }
            }
        }
        
        // If translation not found, return the key
        if (!translation) {
            console.warn(`Translation missing for key: ${key}`);
            return key;
        }

        // Replace placeholders (e.g., :name, :count)
        let result = translation;
        Object.keys(replacements).forEach(replacementKey => {
            const placeholder = `:${replacementKey}`;
            result = result.replace(new RegExp(placeholder, 'g'), replacements[replacementKey]);
        });

        return result;
    }, [props.language]); // Recreate when language changes

    return {
        t,
        locale: props.locale,
        language: props.language,
        availableLocales: props.availableLocales
    };
};